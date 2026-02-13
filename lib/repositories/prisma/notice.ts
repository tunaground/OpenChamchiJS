import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  NoticeRepository,
  NoticeData,
  CreateNoticeInput,
  UpdateNoticeInput,
  FindNoticeOptions,
  FindByBoardIdWithCountResult,
} from "@/lib/repositories/interfaces/notice";
import { normalizePaginationParams } from "@/lib/types/pagination";

export const noticeRepository: NoticeRepository = {
  async findByBoardId(
    boardId: string,
    options?: FindNoticeOptions
  ): Promise<NoticeData[]> {
    const { offset, limit } = normalizePaginationParams(options ?? {});
    const includeDeleted = options?.includeDeleted ?? false;
    const includeGlobal = options?.includeGlobal ?? false;
    const search = options?.search?.trim();

    const where: Prisma.NoticeWhereInput = {
      ...(includeDeleted ? {} : { deleted: false }),
      ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
    };

    if (includeGlobal) {
      where.OR = [{ boardId }, { boardId: null }];
    } else {
      where.boardId = boardId;
    }

    return prisma.notice.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
    });
  },

  async findByBoardIdWithCount(
    boardId: string,
    options?: FindNoticeOptions
  ): Promise<FindByBoardIdWithCountResult> {
    const { offset, limit } = normalizePaginationParams(options ?? {});
    const includeDeleted = options?.includeDeleted ?? false;
    const includeGlobal = options?.includeGlobal ?? false;
    const search = options?.search?.trim();

    // Use window function COUNT(*) OVER() for single query
    const searchFilter = search ? Prisma.sql`AND "title" ILIKE ${`%${search}%`}` : Prisma.sql``;
    const deletedFilter = includeDeleted ? Prisma.sql`` : Prisma.sql`AND "deleted" = false`;
    const boardFilter = includeGlobal
      ? Prisma.sql`("boardId" = ${boardId} OR "boardId" IS NULL)`
      : Prisma.sql`"boardId" = ${boardId}`;

    const rows = await prisma.$queryRaw<(NoticeData & { _total: bigint })[]>`
      SELECT *, COUNT(*) OVER() as "_total"
      FROM "Notice"
      WHERE ${boardFilter}
        ${deletedFilter}
        ${searchFilter}
      ORDER BY "pinned" DESC, "createdAt" DESC
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
    const search = options?.search?.trim();

    return prisma.notice.count({
      where: {
        boardId,
        ...(includeDeleted ? {} : { deleted: false }),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      },
    });
  },

  async findGlobal(options?: FindNoticeOptions): Promise<NoticeData[]> {
    const { offset, limit } = normalizePaginationParams(options ?? {});
    const includeDeleted = options?.includeDeleted ?? false;
    const search = options?.search?.trim();

    return prisma.notice.findMany({
      where: {
        boardId: null,
        ...(includeDeleted ? {} : { deleted: false }),
        ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
    });
  },

  async findGlobalWithCount(
    options?: FindNoticeOptions
  ): Promise<FindByBoardIdWithCountResult> {
    const { offset, limit } = normalizePaginationParams(options ?? {});
    const includeDeleted = options?.includeDeleted ?? false;
    const search = options?.search?.trim();

    const searchFilter = search ? Prisma.sql`AND "title" ILIKE ${`%${search}%`}` : Prisma.sql``;
    const deletedFilter = includeDeleted ? Prisma.sql`` : Prisma.sql`AND "deleted" = false`;

    const rows = await prisma.$queryRaw<(NoticeData & { _total: bigint })[]>`
      SELECT *, COUNT(*) OVER() as "_total"
      FROM "Notice"
      WHERE "boardId" IS NULL
        ${deletedFilter}
        ${searchFilter}
      ORDER BY "pinned" DESC, "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = rows.length > 0 ? Number(rows[0]._total) : 0;
    const data = rows.map(({ _total, ...rest }) => rest);

    return { data, total };
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
