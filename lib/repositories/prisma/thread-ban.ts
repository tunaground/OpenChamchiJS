import { prisma } from "@/lib/prisma";
import {
  ThreadBanRepository,
  ThreadBanData,
  CreateThreadBanInput,
} from "@/lib/repositories/interfaces/thread-ban";

export const threadBanRepository: ThreadBanRepository = {
  async findByThreadId(threadId: number): Promise<ThreadBanData[]> {
    return prisma.threadBan.findMany({
      where: { threadId, active: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string): Promise<ThreadBanData | null> {
    return prisma.threadBan.findUnique({ where: { id } });
  },

  async isBanned(threadId: number, authorId: string): Promise<boolean> {
    const ban = await prisma.threadBan.findUnique({
      where: { threadId_authorId: { threadId, authorId } },
    });
    return ban !== null && ban.active;
  },

  async createMany(data: CreateThreadBanInput[]): Promise<ThreadBanData[]> {
    const results: ThreadBanData[] = [];
    for (const item of data) {
      const ban = await prisma.threadBan.upsert({
        where: { threadId_authorId: { threadId: item.threadId, authorId: item.authorId } },
        update: { active: true },
        create: item,
      });
      results.push(ban);
    }
    return results;
  },

  async delete(id: string): Promise<ThreadBanData> {
    return prisma.threadBan.update({
      where: { id },
      data: { active: false },
    });
  },
};
