export type SponsorTier = "free" | "featured" | "takeover";

export interface AppRecord {
  id: string;
  name: string;
  category: string;
  iconBg: string;
  iconClass: string;
  websiteUrl: string | null;
  isSponsored: boolean;
  sponsorTier: SponsorTier;
  sponsorExpiresAt: string | null;
  createdAt: string;
}

export interface RenameRecord {
  id: string;
  appId: string;
  honestName: string;
  upvotes: number;
  createdAt: string;
}

export interface AppWithHonestName extends AppRecord {
  honestName: string;
  honestNameId: string | null;
  upvotes: number;
  lastRenamedAt: string | null;
  hasUpvoted: boolean;
}

export interface FeedItem {
  renameId: string;
  appId: string;
  appName: string;
  honestName: string;
  createdAt: string;
}

export type RenameSubmitResult =
  | { ok: true; rename: RenameRecord }
  | { ok: false; reason: "cooldown" | "global_limit" | "not_found" | "invalid" };

export type UpvoteResult =
  | { ok: true; upvotes: number }
  | { ok: false; reason: "already_upvoted" | "not_found" };

export interface TallySubmission {
  name: string;
  websiteUrl?: string;
  category: string;
  honestName: string;
  tier: SponsorTier;
  iconBg?: string;
  iconClass?: string;
}
