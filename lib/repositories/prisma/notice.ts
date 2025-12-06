import { prisma } from "@/lib/prisma";
import {
  NoticeRepository,
  NoticeData,
  CreateNoticeInput,
  UpdateNoticeInput,
} from "@/lib/repositories/interfaces/notice";

export const noticeRepository: NoticeRepository = {
  async findByBoardId(boardId: string): Promise<NoticeData[]> {
    return prisma.notice.findMany({
      where: { boardId, deleted: false },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
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
