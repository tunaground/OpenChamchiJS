import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ResponseRepository,
  ResponseData,
  ResponseWithUser,
  CreateResponseInput,
  UpdateResponseInput,
  FindBySeqRangeOptions,
  FindRecentOptions,
  FindByBoardIdOptions,
  FindByBoardIdResult,
  ResponseFilter,
  AdminResponseFilter,
  AdminResponseCursor,
  ContentSearchCursor,
  ContentSearchResult,
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

function buildAdminFilter(filter?: AdminResponseFilter) {
  if (!filter) return {};

  const conditions: Prisma.ResponseWhereInput = {};

  if (filter.username) {
    conditions.username = { contains: filter.username, mode: "insensitive" };
  }

  if (filter.authorId) {
    conditions.authorId = { contains: filter.authorId, mode: "insensitive" };
  }

  if (filter.email) {
    conditions.user = { email: { contains: filter.email, mode: "insensitive" } };
  }

  return conditions;
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

      // Use provided boardId or get from thread
      const boardId = data.boardId ?? updatedThread.boardId;
      const responseData = { ...data, boardId, seq };

      // 3. Create response (with fallback to MAX(seq)+1 on conflict)
      let response;
      try {
        response = await tx.response.create({
          data: responseData,
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
            data: { ...responseData, seq },
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

  async findByBoardIdCursor(
    boardId: string,
    options?: FindByBoardIdOptions
  ): Promise<FindByBoardIdResult> {
    const { limit = 100, cursor, includeDeleted = false, filter } = options ?? {};

    // Build filter conditions
    const deletedFilter = includeDeleted ? Prisma.sql`` : Prisma.sql`AND r.deleted = false`;

    // Build admin filter (username, authorId, email search)
    let adminFilter = Prisma.sql``;
    if (filter?.username) {
      adminFilter = Prisma.sql`${adminFilter} AND r.username ILIKE ${`%${filter.username}%`}`;
    }
    if (filter?.authorId) {
      adminFilter = Prisma.sql`${adminFilter} AND r."authorId" ILIKE ${`%${filter.authorId}%`}`;
    }
    if (filter?.email) {
      adminFilter = Prisma.sql`${adminFilter} AND u.email ILIKE ${`%${filter.email}%`}`;
    }

    // Build cursor condition using ROW comparison (efficient for composite key)
    const cursorFilter = cursor
      ? Prisma.sql`AND (r."createdAt", r.id) < (${new Date(cursor.createdAt)}::timestamp, ${cursor.id})`
      : Prisma.sql``;

    // Use JOIN for email filter, LEFT JOIN otherwise
    const userJoin = filter?.email
      ? Prisma.sql`JOIN "User" u ON r."userId" = u.id`
      : Prisma.sql`LEFT JOIN "User" u ON r."userId" = u.id`;

    interface RawRow {
      id: string;
      threadId: number;
      boardId: string;
      seq: number;
      username: string;
      authorId: string;
      userId: string | null;
      ip: string;
      content: string;
      attachment: string | null;
      visible: boolean;
      deleted: boolean;
      createdAt: Date;
      user_id: string | null;
      user_name: string | null;
      user_email: string | null;
      thread_id: number;
      thread_title: string;
    }

    const rows = await prisma.$queryRaw<RawRow[]>`
      SELECT
        r.id,
        r."threadId",
        r."boardId",
        r.seq,
        r.username,
        r."authorId",
        r."userId",
        r.ip,
        r.content,
        r.attachment,
        r.visible,
        r.deleted,
        r."createdAt",
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        t.id as thread_id,
        t.title as thread_title
      FROM "Response" r
      ${userJoin}
      JOIN "Thread" t ON r."threadId" = t.id
      WHERE r."boardId" = ${boardId}
        ${deletedFilter}
        ${adminFilter}
        ${cursorFilter}
      ORDER BY r."createdAt" DESC, r.id DESC
      LIMIT ${limit + 1}
    `;

    const hasMore = rows.length > limit;
    const dataRows = hasMore ? rows.slice(0, limit) : rows;

    // Map to ResponseWithUser format
    const data: ResponseWithUser[] = dataRows.map((row) => ({
      id: row.id,
      threadId: row.threadId,
      boardId: row.boardId,
      seq: row.seq,
      username: row.username,
      authorId: row.authorId,
      userId: row.userId,
      ip: row.ip,
      content: row.content,
      attachment: row.attachment,
      visible: row.visible,
      deleted: row.deleted,
      createdAt: row.createdAt,
      user: row.user_id ? { id: row.user_id, name: row.user_name, email: row.user_email } : null,
      thread: { id: row.thread_id, title: row.thread_title },
    }));

    // Build next cursor from last item
    let nextCursor: AdminResponseCursor | null = null;
    if (hasMore && data.length > 0) {
      const lastItem = data[data.length - 1];
      nextCursor = {
        createdAt: lastItem.createdAt.toISOString(),
        id: lastItem.id,
      };
    }

    return { data, hasMore, nextCursor };
  },

  async findByBoardIdChunked(
    boardId: string,
    contentSearch: string,
    options?: {
      limit?: number;
      cursor?: ContentSearchCursor | null;
      includeDeleted?: boolean;
    }
  ): Promise<ContentSearchResult> {
    const { limit = 100, cursor, includeDeleted = false } = options ?? {};
    const chunkSize = 5000;
    const searchPattern = `%${contentSearch}%`;
    const previousScanned = cursor?.scanned ?? 0;

    // Raw query with CTE: 1000-row window + ILIKE filtering
    // Uses (createdAt, id) cursor for stable pagination even with realtime data
    const cursorCreatedAt = cursor?.createdAt ? new Date(cursor.createdAt) : null;
    const cursorId = cursor?.id ?? null;

    interface RawResponse {
      id: string;
      threadId: number;
      boardId: string;
      seq: number;
      username: string;
      authorId: string;
      userId: string | null;
      ip: string;
      content: string;
      attachment: string | null;
      visible: boolean;
      deleted: boolean;
      createdAt: Date;
      user_id: string | null;
      user_name: string | null;
      user_email: string | null;
      thread_id: number;
      thread_title: string;
      window_last_created_at: Date | null;
      window_last_id: string | null;
      window_count: bigint;
    }

    const results = await prisma.$queryRaw<RawResponse[]>`
      WITH search_window AS (
        SELECT r.*
        FROM "Response" r
        WHERE r."boardId" = ${boardId}
          AND (
            ${cursorCreatedAt}::timestamp IS NULL
            OR r."createdAt" < ${cursorCreatedAt}
            OR (r."createdAt" = ${cursorCreatedAt} AND r.id < ${cursorId})
          )
          AND (${includeDeleted} = true OR r.deleted = false)
        ORDER BY r."createdAt" DESC, r.id DESC
        LIMIT ${chunkSize}
      ),
      window_meta AS (
        SELECT
          MIN(w."createdAt") as last_created_at,
          (SELECT id FROM search_window ORDER BY "createdAt" ASC, id ASC LIMIT 1) as last_id,
          COUNT(*) as total_count
        FROM search_window w
      ),
      filtered_results AS (
        SELECT
          w.id,
          w."threadId",
          w."boardId",
          w.seq,
          w.username,
          w."authorId",
          w."userId",
          w.ip,
          w.content,
          w.attachment,
          w.visible,
          w.deleted,
          w."createdAt",
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          t.id as thread_id,
          t.title as thread_title
        FROM search_window w
        LEFT JOIN "User" u ON w."userId" = u.id
        JOIN "Thread" t ON w."threadId" = t.id
        WHERE w.content ILIKE ${searchPattern}
        ORDER BY w."createdAt" DESC, w.id DESC
      )
      SELECT
        r.id,
        r."threadId",
        r."boardId",
        r.seq,
        r.username,
        r."authorId",
        r."userId",
        r.ip,
        r.content,
        r.attachment,
        r.visible,
        r.deleted,
        r."createdAt",
        r.user_id,
        r.user_name,
        r.user_email,
        r.thread_id,
        r.thread_title,
        wm.last_created_at as window_last_created_at,
        wm.last_id as window_last_id,
        wm.total_count as window_count
      FROM window_meta wm
      LEFT JOIN filtered_results r ON true
      ORDER BY r."createdAt" DESC NULLS LAST, r.id DESC NULLS LAST
    `;

    // First row always contains window_meta (even if no search results)
    const windowCount = results.length > 0 ? Number(results[0].window_count) : 0;
    const windowLastCreatedAt = results.length > 0 ? results[0].window_last_created_at : null;
    const windowLastId = results.length > 0 ? results[0].window_last_id : null;

    // Map raw results to ResponseWithUser format (filter out NULL rows from LEFT JOIN)
    const data: ResponseWithUser[] = results
      .filter((row) => row.id !== null)
      .map((row) => ({
        id: row.id,
        threadId: row.threadId,
        boardId: row.boardId,
        seq: row.seq,
        username: row.username,
        authorId: row.authorId,
        userId: row.userId,
        ip: row.ip,
        content: row.content,
        attachment: row.attachment,
        visible: row.visible,
        deleted: row.deleted,
        createdAt: row.createdAt,
        user: row.user_id ? { id: row.user_id, name: row.user_name, email: row.user_email } : null,
        thread: { id: row.thread_id, title: row.thread_title },
      }));

    // hasMore: true if we scanned full 1000 rows (more data may exist)
    const hasMore = windowCount === chunkSize;
    const totalScanned = previousScanned + windowCount;

    // Build next cursor from window's last row
    const nextCursor: ContentSearchCursor | null = hasMore && windowLastCreatedAt && windowLastId
      ? {
          createdAt: windowLastCreatedAt.toISOString(),
          id: windowLastId,
          scanned: totalScanned,
        }
      : null;

    return { data, nextCursor, hasMore, scanned: totalScanned };
  },
};
