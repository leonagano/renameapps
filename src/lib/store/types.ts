import type {
  AppWithHonestName,
  FeedItem,
  RenameRecord,
  RenameSubmitResult,
  TallySubmission,
  UpvoteResult,
} from "@/lib/types";

export interface Store {
  listApps(ipHash: string): Promise<AppWithHonestName[]>;
  listAlternatives(appId: string): Promise<RenameRecord[]>;
  submitRename(
    appId: string,
    honestName: string,
    ipHash: string
  ): Promise<RenameSubmitResult>;
  toggleUpvote(
    appId: string,
    renameId: string,
    ipHash: string
  ): Promise<UpvoteResult>;
  listFeed(limit: number): Promise<FeedItem[]>;
  createFromTally(submission: TallySubmission): Promise<AppWithHonestName>;
}

export const RENAME_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const GLOBAL_LIMIT_WINDOW_MS = 60 * 1000;
export const GLOBAL_LIMIT_MAX = 20;
