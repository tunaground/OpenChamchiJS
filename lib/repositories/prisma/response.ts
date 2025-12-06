import { prisma } from "@/lib/prisma";
import {
  ResponseRepository,
  ResponseData,
  CreateResponseInput,
  UpdateResponseInput,
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
