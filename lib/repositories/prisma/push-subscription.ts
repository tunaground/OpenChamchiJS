import { prisma } from "@/lib/prisma";
import {
  PushSubscriptionRepository,
  PushSubscriptionData,
  UpsertPushSubscriptionInput,
} from "@/lib/repositories/interfaces/push-subscription";

export const pushSubscriptionRepository: PushSubscriptionRepository = {
  async upsertByEndpoint(input: UpsertPushSubscriptionInput): Promise<void> {
    const { endpoint, ...rest } = input;
    // Endpoint is globally unique: a different user subscribing takes ownership
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: rest,
      create: input,
    });
  },

  async findByUserIds(userIds: string[]): Promise<PushSubscriptionData[]> {
    if (userIds.length === 0) return [];
    return prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true, locale: true },
    });
  },

  async deleteByEndpoint(endpoint: string, userId?: string): Promise<void> {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, ...(userId ? { userId } : {}) },
    });
  },

  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await prisma.pushSubscription.deleteMany({ where: { id: { in: ids } } });
  },

  async deleteAll(): Promise<void> {
    await prisma.pushSubscription.deleteMany({});
  },

  async touch(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await prisma.pushSubscription.updateMany({
      where: { id: { in: ids } },
      data: { lastUsedAt: new Date() },
    });
  },
};
