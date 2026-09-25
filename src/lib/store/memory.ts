import { randomUUID } from "crypto";
import { SEED_APPS } from "@/lib/data/seed-apps";
import type {
  AppRecord,
  AppWithHonestName,
  FeedItem,
  RenameRecord,
  RenameSubmitResult,
  TallySubmission,
  UpvoteResult,
} from "@/lib/types";
import {
  GLOBAL_LIMIT_MAX,
  GLOBAL_LIMIT_WINDOW_MS,
  RENAME_COOLDOWN_MS,
  type Store,
} from "@/lib/store/types";

interface MemoryDb {
  apps: Map<string, AppRecord>;
  renames: Map<string, RenameRecord>;
  renamesByApp: Map<string, string[]>;
  renameCooldown: Map<string, number>;
  upvoted: Map<string, string>;
  globalActions: Map<string, number[]>;
}

function seedDb(): MemoryDb {
  const db: MemoryDb = {
    apps: new Map(),
    renames: new Map(),
    renamesByApp: new Map(),
    renameCooldown: new Map(),
    upvoted: new Map(),
    globalActions: new Map(),
  };

  const now = Date.now();
  SEED_APPS.forEach((seed, index) => {
    const createdAt = new Date(now - (SEED_APPS.length - index) * 3_600_000).toISOString();
    const app: AppRecord = {
      id: seed.id,
      name: seed.name,
      category: seed.category,
      iconBg: seed.iconBg,
      iconClass: seed.iconClass,
      websiteUrl: seed.websiteUrl ?? null,
      isSponsored: false,
      sponsorTier: "free",
      sponsorExpiresAt: null,
      createdAt,
    };
    db.apps.set(app.id, app);

    const rename: RenameRecord = {
      id: randomUUID(),
      appId: app.id,
      honestName: seed.honestName,
      upvotes: seed.upvotes,
      createdAt,
    };
    db.renames.set(rename.id, rename);
    db.renamesByApp.set(app.id, [rename.id]);
  });

  return db;
}

// Persist across hot-reloads in dev.
const globalForStore = globalThis as unknown as { __renameAppsMemoryDb?: MemoryDb };
const db = globalForStore.__renameAppsMemoryDb ?? seedDb();
globalForStore.__renameAppsMemoryDb = db;

function topRenameForApp(appId: string): RenameRecord | null {
  const ids = db.renamesByApp.get(appId) ?? [];
  let top: RenameRecord | null = null;
  for (const id of ids) {
    const r = db.renames.get(id);
    if (!r) continue;
    if (!top || r.upvotes > top.upvotes) top = r;
  }
  return top;
}

function checkGlobalLimit(ipHash: string): boolean {
  const now = Date.now();
  const timestamps = (db.globalActions.get(ipHash) ?? []).filter(
    (t) => now - t < GLOBAL_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= GLOBAL_LIMIT_MAX) {
    db.globalActions.set(ipHash, timestamps);
    return false;
  }
  timestamps.push(now);
  db.globalActions.set(ipHash, timestamps);
  return true;
}

export const memoryStore: Store = {
  async listApps(ipHash) {
    const result: AppWithHonestName[] = [];
    for (const app of db.apps.values()) {
      const top = topRenameForApp(app.id);
      result.push({
        ...app,
        honestName: top?.honestName ?? "Nobody's Roasted This Yet",
        honestNameId: top?.id ?? null,
        upvotes: top?.upvotes ?? 0,
        lastRenamedAt: top?.createdAt ?? null,
        hasUpvoted: top ? db.upvoted.get(`${ipHash}:${app.id}`) === top.id : false,
      });
    }
    return result;
  },

  async listAlternatives(appId) {
    const ids = db.renamesByApp.get(appId) ?? [];
    return ids
      .map((id) => db.renames.get(id))
      .filter((r): r is RenameRecord => Boolean(r))
      .sort((a, b) => b.upvotes - a.upvotes);
  },

  async submitRename(appId, honestName, ipHash): Promise<RenameSubmitResult> {
    if (!db.apps.has(appId)) return { ok: false, reason: "not_found" };
    if (!honestName.trim() || honestName.length > 120) {
      return { ok: false, reason: "invalid" };
    }
    if (!checkGlobalLimit(ipHash)) return { ok: false, reason: "global_limit" };

    const cooldownKey = `${ipHash}:${appId}`;
    const last = db.renameCooldown.get(cooldownKey);
    if (last && Date.now() - last < RENAME_COOLDOWN_MS) {
      return { ok: false, reason: "cooldown" };
    }

    const rename: RenameRecord = {
      id: randomUUID(),
      appId,
      honestName: honestName.trim(),
      upvotes: 1,
      createdAt: new Date().toISOString(),
    };
    db.renames.set(rename.id, rename);
    const list = db.renamesByApp.get(appId) ?? [];
    list.push(rename.id);
    db.renamesByApp.set(appId, list);
    db.renameCooldown.set(cooldownKey, Date.now());
    db.upvoted.set(`${ipHash}:${appId}`, rename.id);

    return { ok: true, rename };
  },

  async toggleUpvote(appId, renameId, ipHash): Promise<UpvoteResult> {
    const rename = db.renames.get(renameId);
    if (!rename || rename.appId !== appId) return { ok: false, reason: "not_found" };

    const key = `${ipHash}:${appId}`;
    if (db.upvoted.has(key)) {
      return { ok: false, reason: "already_upvoted" };
    }

    rename.upvotes += 1;
    db.upvoted.set(key, renameId);
    return { ok: true, upvotes: rename.upvotes };
  },

  async listFeed(limit) {
    const items: FeedItem[] = [];
    for (const rename of db.renames.values()) {
      const app = db.apps.get(rename.appId);
      if (!app) continue;
      items.push({
        renameId: rename.id,
        appId: app.id,
        appName: app.name,
        honestName: rename.honestName,
        createdAt: rename.createdAt,
      });
    }
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return items.slice(0, limit);
  },

  async createFromTally(submission: TallySubmission): Promise<AppWithHonestName> {
    const id = `${submission.name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${randomUUID().slice(0, 8)}`;
    const tierDays = submission.tier === "takeover" ? 14 : submission.tier === "featured" ? 7 : null;
    const app: AppRecord = {
      id,
      name: submission.name,
      category: submission.category,
      iconBg: submission.iconBg ?? "from-red-500 to-rose-700",
      iconClass: submission.iconClass ?? "fa-solid fa-cube",
      websiteUrl: submission.websiteUrl ?? null,
      isSponsored: submission.tier !== "free",
      sponsorTier: submission.tier,
      sponsorExpiresAt: tierDays
        ? new Date(Date.now() + tierDays * 86_400_000).toISOString()
        : null,
      createdAt: new Date().toISOString(),
    };
    db.apps.set(app.id, app);

    const rename: RenameRecord = {
      id: randomUUID(),
      appId: app.id,
      honestName: submission.honestName,
      upvotes: 1,
      createdAt: app.createdAt,
    };
    db.renames.set(rename.id, rename);
    db.renamesByApp.set(app.id, [rename.id]);

    return {
      ...app,
      honestName: rename.honestName,
      honestNameId: rename.id,
      upvotes: rename.upvotes,
      lastRenamedAt: rename.createdAt,
      hasUpvoted: false,
    };
  },
};
