import { neon } from "@neondatabase/serverless";
import { SEED_APPS } from "@/lib/data/seed-apps";
import type {
  AppWithHonestName,
  FeedItem,
  RenameRecord,
  RenameSubmitResult,
  TallySubmission,
  UpvoteResult,
} from "@/lib/types";
import { GLOBAL_LIMIT_MAX, type Store } from "@/lib/store/types";

const sql = neon(process.env.DATABASE_URL!);

// Lazily creates the schema and seeds the starter dataset the first time this
// serverless instance touches the database — so a freshly-provisioned Neon
// database (no migration step run yet) still works out of the box. Cached per
// warm instance so it only runs once, not on every request.
let readyPromise: Promise<void> | null = null;

function ensureReady(): Promise<void> {
  if (!readyPromise) readyPromise = initializeDatabase();
  return readyPromise;
}

async function initializeDatabase(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS apps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(80) UNIQUE,
      original_name VARCHAR(100) NOT NULL,
      icon_bg VARCHAR(120) NOT NULL DEFAULT 'from-red-500 to-rose-700',
      icon_class VARCHAR(80) NOT NULL DEFAULT 'fa-solid fa-cube',
      category VARCHAR(50) NOT NULL,
      website_url TEXT,
      is_sponsored BOOLEAN DEFAULT FALSE,
      sponsor_tier VARCHAR(20) DEFAULT 'free',
      sponsor_expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS renames (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
      honest_name VARCHAR(120) NOT NULL,
      upvotes INTEGER DEFAULT 1,
      ip_hash VARCHAR(64) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ip_hash VARCHAR(64) NOT NULL,
      app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
      action_type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_app ON rate_limits (ip_hash, app_id, action_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_created ON rate_limits (ip_hash, created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_renames_app ON renames (app_id, upvotes DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_apps_category ON apps (category)`;

  const existing = (await sql`SELECT COUNT(*)::int AS count FROM apps`) as unknown as {
    count: number;
  }[];
  if (existing[0].count > 0) return;

  for (const seed of SEED_APPS) {
    const inserted = (await sql`
      INSERT INTO apps (slug, original_name, category, icon_bg, icon_class)
      VALUES (${seed.id}, ${seed.name}, ${seed.category}, ${seed.iconBg}, ${seed.iconClass})
      RETURNING id
    `) as unknown as { id: string }[];

    await sql`
      INSERT INTO renames (app_id, honest_name, upvotes, ip_hash)
      VALUES (${inserted[0].id}, ${seed.honestName}, 1, 'seed')
    `;
  }
}

interface AppRow {
  id: string;
  original_name: string;
  category: string;
  icon_bg: string;
  icon_class: string;
  website_url: string | null;
  is_sponsored: boolean;
  sponsor_tier: string;
  sponsor_expires_at: string | null;
  created_at: string;
  honest_name: string | null;
  honest_name_id: string | null;
  upvotes: number | null;
  last_renamed_at: string | null;
  rename_count?: number | string | null;
}

function mapAppRow(row: AppRow, hasUpvoted: boolean): AppWithHonestName {
  return {
    id: row.id,
    name: row.original_name,
    category: row.category,
    iconBg: row.icon_bg,
    iconClass: row.icon_class,
    websiteUrl: row.website_url,
    isSponsored: row.is_sponsored,
    sponsorTier: row.sponsor_tier as AppWithHonestName["sponsorTier"],
    sponsorExpiresAt: row.sponsor_expires_at,
    createdAt: row.created_at,
    honestName: row.honest_name ?? "Nobody's Roasted This Yet",
    honestNameId: row.honest_name_id,
    upvotes: row.upvotes ?? 0,
    lastRenamedAt: row.last_renamed_at,
    hasUpvoted,
    renameCount: Number(row.rename_count ?? (row.honest_name ? 1 : 0)),
  };
}

export const neonStore: Store = {
  async listApps(ipHash) {
    await ensureReady();
    const rows = (await sql`
      SELECT
        a.id, a.original_name, a.category, a.icon_bg, a.icon_class,
        a.website_url, a.is_sponsored, a.sponsor_tier, a.sponsor_expires_at, a.created_at,
        top.honest_name, top.id AS honest_name_id, top.upvotes, top.created_at AS last_renamed_at,
        COALESCE(counts.rename_count, 0) AS rename_count
      FROM apps a
      LEFT JOIN LATERAL (
        SELECT r.id, r.honest_name, r.upvotes, r.created_at
        FROM renames r
        WHERE r.app_id = a.id
        ORDER BY r.upvotes DESC, r.created_at DESC
        LIMIT 1
      ) top ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS rename_count
        FROM renames r
        WHERE r.app_id = a.id
      ) counts ON true
      ORDER BY a.is_sponsored DESC, a.created_at ASC
    `) as unknown as AppRow[];

    const upvotedRows = (await sql`
      SELECT DISTINCT app_id FROM rate_limits
      WHERE ip_hash = ${ipHash} AND action_type = 'upvote'
    `) as unknown as { app_id: string }[];
    const upvotedSet = new Set(upvotedRows.map((r) => r.app_id));

    return rows.map((row) => mapAppRow(row, upvotedSet.has(row.id)));
  },

  async listAlternatives(appId) {
    await ensureReady();
    const rows = (await sql`
      SELECT id, app_id, honest_name, upvotes, created_at
      FROM renames
      WHERE app_id = ${appId}
      ORDER BY upvotes DESC, created_at DESC
    `) as unknown as {
      id: string;
      app_id: string;
      honest_name: string;
      upvotes: number;
      created_at: string;
    }[];

    return rows.map((r) => ({
      id: r.id,
      appId: r.app_id,
      honestName: r.honest_name,
      upvotes: r.upvotes,
      createdAt: r.created_at,
    }));
  },

  async submitRename(appId, honestName, ipHash): Promise<RenameSubmitResult> {
    await ensureReady();
    const trimmed = honestName.trim();
    if (!trimmed || trimmed.length > 120) return { ok: false, reason: "invalid" };

    const appRows = (await sql`SELECT id FROM apps WHERE id = ${appId}`) as unknown as {
      id: string;
    }[];
    if (appRows.length === 0) return { ok: false, reason: "not_found" };

    const globalRows = (await sql`
      SELECT COUNT(*)::int AS count FROM rate_limits
      WHERE ip_hash = ${ipHash} AND action_type = 'rename' AND created_at > NOW() - INTERVAL '1 minute'
    `) as unknown as { count: number }[];
    if (globalRows[0].count >= GLOBAL_LIMIT_MAX) return { ok: false, reason: "global_limit" };

    const cooldownRows = (await sql`
      SELECT 1 FROM rate_limits
      WHERE ip_hash = ${ipHash} AND app_id = ${appId} AND action_type = 'rename'
        AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `) as unknown as unknown[];
    if (cooldownRows.length > 0) return { ok: false, reason: "cooldown" };

    const inserted = (await sql`
      INSERT INTO renames (app_id, honest_name, upvotes, ip_hash)
      VALUES (${appId}, ${trimmed}, 1, ${ipHash})
      RETURNING id, app_id, honest_name, upvotes, created_at
    `) as unknown as {
      id: string;
      app_id: string;
      honest_name: string;
      upvotes: number;
      created_at: string;
    }[];

    await sql`
      INSERT INTO rate_limits (ip_hash, app_id, action_type) VALUES (${ipHash}, ${appId}, 'rename')
    `;
    await sql`
      INSERT INTO rate_limits (ip_hash, app_id, action_type) VALUES (${ipHash}, ${appId}, 'upvote')
    `;

    const row = inserted[0];
    const rename: RenameRecord = {
      id: row.id,
      appId: row.app_id,
      honestName: row.honest_name,
      upvotes: row.upvotes,
      createdAt: row.created_at,
    };
    return { ok: true, rename };
  },

  async toggleUpvote(appId, renameId, ipHash): Promise<UpvoteResult> {
    await ensureReady();
    const renameRows = (await sql`
      SELECT id FROM renames WHERE id = ${renameId} AND app_id = ${appId}
    `) as unknown as { id: string }[];
    if (renameRows.length === 0) return { ok: false, reason: "not_found" };

    const existing = (await sql`
      SELECT 1 FROM rate_limits
      WHERE ip_hash = ${ipHash} AND app_id = ${appId} AND action_type = 'upvote'
      LIMIT 1
    `) as unknown as unknown[];
    if (existing.length > 0) return { ok: false, reason: "already_upvoted" };

    const updated = (await sql`
      UPDATE renames SET upvotes = upvotes + 1 WHERE id = ${renameId}
      RETURNING upvotes
    `) as unknown as { upvotes: number }[];

    await sql`
      INSERT INTO rate_limits (ip_hash, app_id, action_type) VALUES (${ipHash}, ${appId}, 'upvote')
    `;

    return { ok: true, upvotes: updated[0].upvotes };
  },

  async listFeed(limit) {
    await ensureReady();
    const rows = (await sql`
      SELECT r.id AS rename_id, r.app_id, a.original_name AS app_name, r.honest_name, r.created_at
      FROM renames r
      JOIN apps a ON a.id = r.app_id
      ORDER BY r.created_at DESC
      LIMIT ${limit}
    `) as unknown as {
      rename_id: string;
      app_id: string;
      app_name: string;
      honest_name: string;
      created_at: string;
    }[];

    return rows.map((r) => ({
      renameId: r.rename_id,
      appId: r.app_id,
      appName: r.app_name,
      honestName: r.honest_name,
      createdAt: r.created_at,
    })) satisfies FeedItem[];
  },

  async createFromTally(submission: TallySubmission): Promise<AppWithHonestName> {
    await ensureReady();
    const tierDays =
      submission.tier === "takeover" ? 14 : submission.tier === "featured" ? 7 : null;

    const appRows = (await sql`
      INSERT INTO apps (original_name, category, icon_bg, icon_class, website_url, is_sponsored, sponsor_tier, sponsor_expires_at)
      VALUES (
        ${submission.name},
        ${submission.category},
        ${submission.iconBg ?? "from-red-500 to-rose-700"},
        ${submission.iconClass ?? "fa-solid fa-cube"},
        ${submission.websiteUrl ?? null},
        ${submission.tier !== "free"},
        ${submission.tier},
        ${tierDays ? new Date(Date.now() + tierDays * 86_400_000).toISOString() : null}
      )
      RETURNING id, original_name, category, icon_bg, icon_class, website_url, is_sponsored, sponsor_tier, sponsor_expires_at, created_at
    `) as unknown as AppRow[];
    const app = appRows[0];

    const renameRows = (await sql`
      INSERT INTO renames (app_id, honest_name, upvotes, ip_hash)
      VALUES (${app.id}, ${submission.honestName}, 1, 'tally-webhook')
      RETURNING id, honest_name, upvotes, created_at
    `) as unknown as { id: string; honest_name: string; upvotes: number; created_at: string }[];
    const rename = renameRows[0];

    return mapAppRow(
      {
        ...app,
        honest_name: rename.honest_name,
        honest_name_id: rename.id,
        upvotes: rename.upvotes,
        last_renamed_at: rename.created_at,
      },
      false
    );
  },
};
