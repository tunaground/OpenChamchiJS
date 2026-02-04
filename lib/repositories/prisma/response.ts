import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ResponseRepository,
  ResponseData,
  CreateResponseInput,
  UpdateResponseInput,
  FindBySeqRangeOptions,
  FindRecentOptions,
  ResponseFilter,
} from "@/lib/repositories/interfaces/response";

function buildUserFilter(filter?: ResponseFilter) {
  if (!filter) return {};

  const conditions = [];

  if (filter.usernames && filter.usernames.length > 0) {
    conditions.push({ username: { in: filter.usernames } });
  }

  if (filter.authorIds && filter.authorIds.length > 0) {
    conditions.push({ authorId: { in: filter.authorIds } });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];

  // OR condition for multiple filters
  return { OR: conditions };
}

export const responseRepository: ResponseRepository = {
  async findByThreadId(
    threadId: number,
    options?: { limit?: number; offset?: number; includeDeleted?: boolean; includeHidden?: boolean; filter?: ResponseFilter }
  ): Promise<ResponseData[]> {
    const { limit = 50, offset = 0, includeDeleted = false, includeHidden = false, filter } = options ?? {};

    // Build visibility filter
    // includeDeleted: include deleted=true (admin only)
    // includeHidden: include visible=false (password holder or admin)
    let visibilityFilter = {};
    if (!includeDeleted && !includeHidden) {
      // Normal view: only visible and not deleted
      visibilityFilter = { deleted: false, visible: true };
    } else if (includeDeleted && includeHidden) {
      // Admin view: show everything
      visibilityFilter = {};
    } else if (includeDeleted) {
      // Admin view without hidden filter
      visibilityFilter = {};
    } else if (includeHidden) {
      // Password holder view: show hidden but not deleted
      visibilityFilter = { deleted: false };
    }

    return prisma.response.findMany({
      where: {
        threadId,
        ...visibilityFilter,
        ...buildUserFilter(filter),
      },
      orderBy: { seq: "asc" },
      take: limit,
      skip: offset,
    });
  },

  async findById(id: string): Promise<ResponseData | null> {
    return prisma.response.findUnique({ where: { id } });
  },

  async findByThreadIdAndSeq(
    threadId: number,
    seq: number
  ): Promise<ResponseData | null> {
    return prisma.response.findUnique({
      where: { threadId_seq: { threadId, seq } },
    });
  },

  async findByThreadIdAndSeqRange(
    threadId: number,
    options: FindBySeqRangeOptions & { filter?: ResponseFilter }
  ): Promise<ResponseData[]> {
    const { startSeq, endSeq, includeDeleted = false, filter } = options;

    return prisma.response.findMany({
      where: {
        threadId,
        seq: {
          gte: startSeq,
          lte: endSeq,
        },
        ...(includeDeleted ? {} : { deleted: false, visible: true }),
        ...buildUserFilter(filter),
      },
      orderBy: { seq: "asc" },
    });
  },

  async findRecentByThreadId(
    threadId: number,
    options: FindRecentOptions & { filter?: ResponseFilter }
  ): Promise<ResponseData[]> {
    const { limit, includeDeleted = false, filter } = options;

    // Build filter conditions for raw query
    const visibilityFilter = includeDeleted
      ? Prisma.sql``
      : Prisma.sql`AND "deleted" = false AND "visible" = true`;

    // Build user filter for raw query
    let userFilterSql = Prisma.sql``;
    if (filter?.usernames && filter.usernames.length > 0) {
      userFilterSql = Prisma.sql`AND "username" = ANY(${filter.usernames})`;
    } else if (filter?.authorIds && filter.authorIds.length > 0) {
      userFilterSql = Prisma.sql`AND "authorId" = ANY(${filter.authorIds})`;
    }

    // Single UNION ALL query: seq=0 (thread body) + latest N responses, ordered by seq
    const responses = await prisma.$queryRaw<ResponseData[]>`
      (
        SELECT * FROM "Response"
        WHERE "threadId" = ${threadId}
          AND "seq" = 0
          ${visibilityFilter}
          ${userFilterSql}
        LIMIT 1
      )
      UNION ALL
      (
        SELECT * FROM (
          SELECT * FROM "Response"
          WHERE "threadId" = ${threadId}
            AND "seq" > 0
            ${visibilityFilter}
            ${userFilterSql}
          ORDER BY "seq" DESC
          LIMIT ${limit}
        ) sub
      )
      ORDER BY "seq" ASC
    `;

    return responses;
  },

  async create(data: CreateResponseInput): Promise<ResponseData> {
    return prisma.$transaction(async (tx) => {
      // 1. Atomically increment Thread.responseCount (row-level lock)
      const updatedThread = await tx.thread.update({
        where: { id: data.threadId },
        data: { responseCount: { increment: 1 } },
        select: { responseCount: true, boardId: true, published: true },
      });

      // 2. seq = incremented value - 1
      let seq = updatedThread.responseCount - 1;

      // 3. Create response (with fallback to MAX(seq)+1 on conflict)
      let response;
      try {
        response = await tx.response.create({
          data: {
            ...data,
            seq,
          },
        });
      } catch (e) {
        // seq conflict: fallback to MAX(seq)+1
        if (e instanceof Error && e.message.includes("Unique constraint")) {
          const maxSeqResult = await tx.response.aggregate({
            where: { threadId: data.threadId },
            _max: { seq: true },
          });
          seq = (maxSeqResult._max.seq ?? -1) + 1;

          response = await tx.response.create({
            data: {
              ...data,
              seq,
            },
          });

          // Fix responseCount to match actual count
          const actualCount = await tx.response.count({
            where: { threadId: data.threadId },
          });
          await tx.thread.update({
            where: { id: data.threadId },
            data: { responseCount: actualCount },
          });
        } else {
          throw e;
        }
      }

      // 4. First response (seq=0): publish thread + increment board counter
      if (seq === 0) {
        await tx.thread.update({
          where: { id: data.threadId },
          data: { published: true },
        });
        await tx.board.update({
          where: { id: updatedThread.boardId },
          data: { threadCount: { increment: 1 } },
        });
      }

      return response;
    });
  },

  async update(id: string, data: UpdateResponseInput): Promise<ResponseData> {
    return prisma.response.update({ where: { id }, data });
  },

  async delete(id: string): Promise<ResponseData> {
    return prisma.response.update({
      where: { id },
      data: { deleted: true },
    });
  },

  async countByThreadId(threadId: number): Promise<number> {
    return prisma.response.count({ where: { threadId, deleted: false } });
  },
};
