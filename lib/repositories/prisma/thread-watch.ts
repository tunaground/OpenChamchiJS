import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ThreadWatchRepository,
  ThreadWatchListItem,
  CreateWatchResult,
  PushRecipient,
} from "@/lib/repositories/interfaces/thread-watch";

export const threadWatchRepository: ThreadWatchRepository = {
  async findActiveByUser(userId: string): Promise<ThreadWatchListItem[]> {
    const watches = await prisma.threadWatch.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { thread: { select: { boardId: true, title: true, deleted: true } } },
    });
    return watches.map((w) => ({
      id: w.id,
      threadId: w.threadId,
      boardId: w.thread.boardId,
      title: w.thread.title,
      threadDeleted: w.thread.deleted,
      enabled: w.enabled,
    }));
  },

  async findByUserAndThread(userId: string, threadId: number) {
    return prisma.threadWatch.findUnique({
      where: { userId_threadId: { userId, threadId } },
      select: { id: true, enabled: true },
    });
  },

  async countByUser(userId: string): Promise<number> {
    return prisma.threadWatch.count({ where: { userId } });
  },

  async createWithinLimit(
    userId: string,
    threadId: number,
    limit: number
  ): Promise<CreateWatchResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Serialize watch creation per user so the limit check cannot race
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

        const existing = await tx.threadWatch.findUnique({
          where: { userId_threadId: { userId, threadId } },
          select: { id: true },
        });
        if (existing) return "exists";

        const count = await tx.threadWatch.count({ where: { userId } });
        if (count >= limit) return "limit";

        await tx.threadWatch.create({ data: { userId, threadId } });
        return "created";
      });
    } catch (error) {
      // A concurrent request created the same watch first
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return "exists";
      }
      throw error;
    }
  },

  async findById(id: string) {
    return prisma.threadWatch.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  },

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await prisma.threadWatch.update({ where: { id }, data: { enabled } });
  },

  async delete(id: string): Promise<void> {
    await prisma.threadWatch.delete({ where: { id } });
  },

  async deleteByUserAndThread(userId: string, threadId: number): Promise<void> {
    await prisma.threadWatch.deleteMany({ where: { userId, threadId } });
  },

  async setViewing(userId: string, threadId: number, at: Date | null): Promise<void> {
    await prisma.threadWatch.updateMany({
      where: { userId, threadId },
      data: { lastViewingAt: at },
    });
  },

  async getUserPushEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushEnabled: true },
    });
    return user?.pushEnabled ?? true;
  },

  async setUserPushEnabled(userId: string, enabled: boolean): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { pushEnabled: enabled } });
  },

  async claimRecipients(
    threadId: number,
    excludeUserId: string | null
  ): Promise<PushRecipient[]> {
    // One statement: concurrent replies cannot both claim the same cooldown window.
    // Columns are UTC "timestamp without time zone" (Prisma default), so compare in UTC.
    return prisma.$queryRaw<PushRecipient[]>`
      UPDATE "ThreadWatch" w SET "lastPushedAt" = (now() AT TIME ZONE 'UTC')
      FROM "User" u, "Thread" t
      WHERE w."threadId" = ${threadId}
        AND u.id = w."userId"
        AND t.id = w."threadId"
        AND w.enabled
        AND u."pushEnabled"
        AND NOT t.deleted
        AND (${excludeUserId}::text IS NULL OR w."userId" <> ${excludeUserId}::text)
        AND (w."lastPushedAt" IS NULL OR w."lastPushedAt" < (now() AT TIME ZONE 'UTC') - interval '60 seconds')
        AND (w."lastViewingAt" IS NULL OR w."lastViewingAt" < (now() AT TIME ZONE 'UTC') - interval '45 seconds')
      RETURNING w."userId" AS "userId", t.title AS title, t."boardId" AS "boardId"
    `;
  },
};
