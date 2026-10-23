export interface ThreadWatchListItem {
  id: string;
  threadId: number;
  boardId: string;
  title: string;
  threadDeleted: boolean;
  enabled: boolean;
}

export interface PushRecipient {
  userId: string;
  title: string;
  boardId: string;
}

export type CreateWatchResult = "created" | "exists" | "limit";

export interface ThreadWatchRepository {
  findActiveByUser(userId: string): Promise<ThreadWatchListItem[]>;
  findByUserAndThread(
    userId: string,
    threadId: number
  ): Promise<{ id: string; enabled: boolean } | null>;
  countByUser(userId: string): Promise<number>;
  createWithinLimit(
    userId: string,
    threadId: number,
    limit: number
  ): Promise<CreateWatchResult>;
  findById(id: string): Promise<{ id: string; userId: string } | null>;
  setEnabled(id: string, enabled: boolean): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByUserAndThread(userId: string, threadId: number): Promise<void>;
  setViewing(userId: string, threadId: number, at: Date | null): Promise<void>;
  getUserPushEnabled(userId: string): Promise<boolean>;
  setUserPushEnabled(userId: string, enabled: boolean): Promise<void>;
  claimRecipients(threadId: number, excludeUserId: string | null): Promise<PushRecipient[]>;
}
