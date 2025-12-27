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

    const userFilter = buildUserFilter(filter);

    // Get seq 0 (thread body) and latest responses
    const [firstResponse, recentResponses] = await Promise.all([
      prisma.response.findFirst({
        where: {
          threadId,
          seq: 0,
          ...(includeDeleted ? {} : { deleted: false, visible: true }),
          ...userFilter,
        },
      }),
      prisma.response.findMany({
        where: {
          threadId,
          seq: { gt: 0 },
          ...(includeDeleted ? {} : { deleted: false, visible: true }),
          ...userFilter,
        },
        orderBy: { seq: "desc" },
        take: limit,
      }),
    ]);

    const responses: ResponseData[] = [];
    if (firstResponse) {
      responses.push(firstResponse);
    }
    // Reverse to get ascending order
    responses.push(...recentResponses.reverse());

    return responses;
  },

  async create(data: CreateResponseInput): Promise<ResponseData> {
    const count = await prisma.response.count({
      where: { threadId: data.threadId },
    });

    const seq = count;

    // If this is the first response (seq 0), also publish the thread
    if (seq === 0) {
      const [response] = await prisma.$transaction([
        prisma.response.create({
          data: {
            ...data,
            seq,
          },
        }),
        prisma.thread.update({
          where: { id: data.threadId },
          data: { published: true },
        }),
      ]);
      return response;
    }

    return prisma.response.create({
      data: {
        ...data,
        seq,
      },
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
