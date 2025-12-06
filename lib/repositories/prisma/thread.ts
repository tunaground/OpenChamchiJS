import { prisma } from "@/lib/prisma";
import {
  ThreadRepository,
  ThreadData,
  ThreadWithResponseCount,
  CreateThreadInput,
  UpdateThreadInput,
  FindThreadOptions,
} from "@/lib/repositories/interfaces/thread";

export const threadRepository: ThreadRepository = {
  async findByBoardId(
    boardId: string,
    options?: FindThreadOptions
  ): Promise<ThreadData[]> {
    const { limit = 20, offset = 0, includeDeleted = false, search } = options ?? {};

    return prisma.thread.findMany({
      where: {
        boardId,
        ...(includeDeleted ? {} : { deleted: false }),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                { username: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ top: "desc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
    });
  },

  async findByBoardIdWithResponseCount(
    boardId: string,
    options?: FindThreadOptions
  ): Promise<ThreadWithResponseCount[]> {
    const { limit = 20, offset = 0, includeDeleted = false, search } = options ?? {};

    const threads = await prisma.thread.findMany({
      where: {
        boardId,
        ...(includeDeleted ? {} : { deleted: false }),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                { username: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ top: "desc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    return threads.map((thread) => ({
      ...thread,
      responseCount: thread._count.responses,
    }));
  },

  async countByBoardId(
    boardId: string,
    options?: { includeDeleted?: boolean; search?: string }
  ): Promise<number> {
    const includeDeleted = options?.includeDeleted ?? false;
    const search = options?.search;

    return prisma.thread.count({
      where: {
        boardId,
        ...(includeDeleted ? {} : { deleted: false }),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                { username: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
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
