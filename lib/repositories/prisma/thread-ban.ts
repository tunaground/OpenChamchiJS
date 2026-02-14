import { prisma } from "@/lib/prisma";
import {
  ThreadBanRepository,
  ThreadBanData,
  CreateThreadBanInput,
} from "@/lib/repositories/interfaces/thread-ban";

export const threadBanRepository: ThreadBanRepository = {
  async findByThreadId(threadId: number): Promise<ThreadBanData[]> {
    return prisma.threadBan.findMany({
      where: { threadId },
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
    return ban !== null;
  },

  async createMany(data: CreateThreadBanInput[]): Promise<ThreadBanData[]> {
    const results: ThreadBanData[] = [];
    for (const item of data) {
      try {
        const ban = await prisma.threadBan.create({ data: item });
        results.push(ban);
      } catch (error: unknown) {
        // Skip duplicate (unique constraint violation)
        if (
          error instanceof Error &&
          "code" in error &&
          (error as { code: string }).code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }
    return results;
  },

  async delete(id: string): Promise<ThreadBanData> {
    return prisma.threadBan.delete({ where: { id } });
  },
};
