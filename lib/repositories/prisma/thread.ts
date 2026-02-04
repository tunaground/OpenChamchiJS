import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ThreadRepository,
  ThreadData,
  ThreadWithResponseCount,
  CreateThreadInput,
  UpdateThreadInput,
  FindThreadOptions,
  FindByBoardIdWithCountResult,
} from "@/lib/repositories/interfaces/thread";
import { DEFAULT_LIMIT } from "@/lib/types/pagination";

export const threadRepository: ThreadRepository = {
  async findByBoardId(
    boardId: string,
    options?: FindThreadOptions
  ): Promise<ThreadData[]> {
    const { limit = DEFAULT_LIMIT, offset = 0, includeDeleted = false, search } = options ?? {};

    return prisma.thread.findMany({
      where: {
        boardId,
        published: true,
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
    const { limit = DEFAULT_LIMIT, offset = 0, includeDeleted = false, search } = options ?? {};

    return prisma.thread.findMany({
      where: {
        boardId,
        published: true,
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

  async findByBoardIdWithCount(
    boardId: string,
    boardThreadCount: number,
    options?: FindThreadOptions
  ): Promise<FindByBoardIdWithCountResult> {
    const { limit = DEFAULT_LIMIT, offset = 0, includeDeleted = false, search } = options ?? {};

    // If no search filter, use counter cache for total
    if (!search) {
      const data = await prisma.thread.findMany({
        where: {
          boardId,
          published: true,
          ...(includeDeleted ? {} : { deleted: false }),
        },
        orderBy: [{ top: "desc" }, { updatedAt: "desc" }],
        take: limit,
        skip: offset,
      });
      return { data, total: boardThreadCount };
    }

    // With search: use window function COUNT(*) OVER() in raw query
    const searchPattern = `%${search}%`;
    const deletedFilter = includeDeleted ? Prisma.sql`` : Prisma.sql`AND "deleted" = false`;
    const rows = await prisma.$queryRaw<(ThreadWithResponseCount & { _total: bigint })[]>`
      SELECT *, COUNT(*) OVER() as "_total"
      FROM "Thread"
      WHERE "boardId" = ${boardId}
        AND "published" = true
        ${deletedFilter}
        AND (
          "title" ILIKE ${searchPattern}
          OR "username" ILIKE ${searchPattern}
        )
      ORDER BY "top" DESC, "updatedAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = rows.length > 0 ? Number(rows[0]._total) : 0;
    const data = rows.map(({ _total, ...rest }) => rest);

    return { data, total };
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
        published: true,
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
    return prisma.$transaction(async (tx) => {
      const thread = await tx.thread.findUnique({ where: { id } });

      // Decrement board counter only if thread was published and not already deleted
      if (thread && thread.published && !thread.deleted) {
        await tx.board.update({
          where: { id: thread.boardId },
          data: { threadCount: { decrement: 1 } },
        });
      }

      return tx.thread.update({
        where: { id },
        data: { deleted: true },
      });
    });
  },

  async updateBumpTime(id: number): Promise<ThreadData> {
    return prisma.thread.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  },
};
