import { neon } from "@neondatabase/serverless";
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
  };
}

export const neonStore: Store = {
  async listApps(ipHash) {
    const rows = (await sql`
      SELECT
        a.id, a.original_name, a.category, a.icon_bg, a.icon_class,
        a.website_url, a.is_sponsored, a.sponsor_tier, a.sponsor_expires_at, a.created_at,
        top.honest_name, top.id AS honest_name_id, top.upvotes, top.created_at AS last_renamed_at
      FROM apps a
      LEFT JOIN LATERAL (
        SELECT r.id, r.honest_name, r.upvotes, r.created_at
        FROM renames r
        WHERE r.app_id = a.id
        ORDER BY r.upvotes DESC, r.created_at DESC
        LIMIT 1
      ) top ON true
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
