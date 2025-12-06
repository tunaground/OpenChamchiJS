import { prisma } from "@/lib/prisma";
import {
  ResponseRepository,
  ResponseData,
  CreateResponseInput,
  UpdateResponseInput,
  FindBySeqRangeOptions,
  FindRecentOptions,
} from "@/lib/repositories/interfaces/response";

export const responseRepository: ResponseRepository = {
  async findByThreadId(
    threadId: number,
    options?: { limit?: number; offset?: number; includeDeleted?: boolean }
  ): Promise<ResponseData[]> {
    const { limit = 50, offset = 0, includeDeleted = false } = options ?? {};

    return prisma.response.findMany({
      where: {
        threadId,
        ...(includeDeleted ? {} : { deleted: false }),
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
    options: FindBySeqRangeOptions
  ): Promise<ResponseData[]> {
    const { startSeq, endSeq, includeDeleted = false } = options;

    return prisma.response.findMany({
      where: {
        threadId,
        seq: {
          gte: startSeq,
          lte: endSeq,
        },
        ...(includeDeleted ? {} : { deleted: false }),
      },
      orderBy: { seq: "asc" },
    });
  },

  async findRecentByThreadId(
    threadId: number,
    options: FindRecentOptions
  ): Promise<ResponseData[]> {
    const { limit, includeDeleted = false } = options;

    // Get seq 0 (thread body) and latest responses
    const [firstResponse, recentResponses] = await Promise.all([
      prisma.response.findFirst({
        where: {
          threadId,
          seq: 0,
          ...(includeDeleted ? {} : { deleted: false }),
        },
      }),
      prisma.response.findMany({
        where: {
          threadId,
          seq: { gt: 0 },
          ...(includeDeleted ? {} : { deleted: false }),
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

    return prisma.response.create({
      data: {
        ...data,
        seq: count,
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
