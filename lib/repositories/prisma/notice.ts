import { prisma } from "@/lib/prisma";
import {
  NoticeRepository,
  NoticeData,
  CreateNoticeInput,
  UpdateNoticeInput,
  FindNoticeOptions,
} from "@/lib/repositories/interfaces/notice";
import { normalizePaginationParams } from "@/lib/types/pagination";

export const noticeRepository: NoticeRepository = {
  async findByBoardId(
    boardId: string,
    options?: FindNoticeOptions
  ): Promise<NoticeData[]> {
    const { offset, limit } = normalizePaginationParams(options ?? {});
    const includeDeleted = options?.includeDeleted ?? false;
    const search = options?.search?.trim();

    return prisma.notice.findMany({
      where: {
        boardId,
        ...(includeDeleted ? {} : { deleted: false }),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
    });
  },

  async countByBoardId(
    boardId: string,
    options?: { includeDeleted?: boolean; search?: string }
  ): Promise<number> {
    const includeDeleted = options?.includeDeleted ?? false;
    const search = options?.search?.trim();

    return prisma.notice.count({
      where: {
        boardId,
        ...(includeDeleted ? {} : { deleted: false }),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      },
    });
  },

  async findById(id: number): Promise<NoticeData | null> {
    return prisma.notice.findUnique({ where: { id } });
  },

  async create(data: CreateNoticeInput): Promise<NoticeData> {
    return prisma.notice.create({ data });
  },

  async update(id: number, data: UpdateNoticeInput): Promise<NoticeData> {
    return prisma.notice.update({ where: { id }, data });
  },

  async delete(id: number): Promise<NoticeData> {
    return prisma.notice.update({
      where: { id },
      data: { deleted: true },
    });
  },
};
