export interface PushSubscriptionData {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  locale: string | null;
}

export interface UpsertPushSubscriptionInput {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  locale: string | null;
  userAgent: string | null;
}

export interface PushSubscriptionRepository {
  upsertByEndpoint(input: UpsertPushSubscriptionInput): Promise<void>;
  findByUserIds(userIds: string[]): Promise<PushSubscriptionData[]>;
  deleteByEndpoint(endpoint: string, userId?: string): Promise<void>;
  deleteByIds(ids: string[]): Promise<void>;
  deleteAll(): Promise<void>;
  touch(ids: string[]): Promise<void>;
}
