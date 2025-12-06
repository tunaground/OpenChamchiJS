import { prisma } from "@/lib/prisma";
import {
  ThreadRepository,
  ThreadData,
  CreateThreadInput,
  UpdateThreadInput,
} from "@/lib/repositories/interfaces/thread";

export const threadRepository: ThreadRepository = {
  async findByBoardId(
    boardId: string,
    options?: { limit?: number; offset?: number; includeDeleted?: boolean }
  ): Promise<ThreadData[]> {
    const { limit = 20, offset = 0, includeDeleted = false } = options ?? {};

    return prisma.thread.findMany({
      where: {
        boardId,
        ...(includeDeleted ? {} : { deleted: false }),
      },
      orderBy: [{ top: "desc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
    });
  },

  async findById(id: number): Promise<ThreadData | null> {
    return prisma.thread.findUnique({ where: { id } });
  },

  async create(data: CreateThreadInput): Promise<ThreadData> {
    return prisma.thread.create({ data });
  },

  async update(id: number, data: UpdateThreadInput): Promise<ThreadData> {
    return prisma.thread.update({ where: { id }, data });
  },

  async delete(id: number): Promise<ThreadData> {
    return prisma.thread.update({
      where: { id },
      data: { deleted: true },
    });
  },

  async updateBumpTime(id: number): Promise<ThreadData> {
    return prisma.thread.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  },
};
