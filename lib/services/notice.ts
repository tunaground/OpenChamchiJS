import {
  permissionService as defaultPermissionService,
  PermissionService,
} from "@/lib/services/permission";
import { noticeRepository as defaultNoticeRepository } from "@/lib/repositories/prisma/notice";
import { boardRepository as defaultBoardRepository } from "@/lib/repositories/prisma/board";
import {
  NoticeRepository,
  NoticeData,
  CreateNoticeInput,
  UpdateNoticeInput,
} from "@/lib/repositories/interfaces/notice";
import { BoardRepository } from "@/lib/repositories/interfaces/board";
import {
  PaginatedResult,
  PaginationParams,
  normalizePaginationParams,
  createPaginatedResult,
} from "@/lib/types/pagination";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";

export class NoticeServiceError extends ServiceError {
  constructor(
    message: string,
    code: ServiceErrorCode
  ) {
    super(message, code);
    this.name = "NoticeServiceError";
  }
}

export interface FindNoticeParams extends PaginationParams {
  search?: string;
}

export interface NoticeService {
  findByBoardId(
    boardId: string,
    options?: FindNoticeParams
  ): Promise<PaginatedResult<NoticeData>>;
  findPinnedAndRecent(boardId: string, recentCount?: number): Promise<NoticeData[]>;
  findById(id: number): Promise<NoticeData>;
  create(userId: string, data: CreateNoticeInput): Promise<NoticeData>;
  update(userId: string, id: number, data: UpdateNoticeInput): Promise<NoticeData>;
  delete(userId: string, id: number): Promise<NoticeData>;
}

interface NoticeServiceDeps {
  noticeRepository: NoticeRepository;
  boardRepository: BoardRepository;
  permissionService: PermissionService;
}

export function createNoticeService(deps: NoticeServiceDeps): NoticeService {
  const { noticeRepository, boardRepository, permissionService } = deps;

  async function checkPermissions(
    userId: string,
    permissions: string[]
  ): Promise<boolean> {
    return permissionService.checkUserPermissions(userId, permissions);
  }

  return {
    async findByBoardId(
      boardId: string,
      options?: FindNoticeParams
    ): Promise<PaginatedResult<NoticeData>> {
      const board = await boardRepository.findById(boardId);
      if (!board || board.deleted) {
        throw new NoticeServiceError("Board not found", "NOT_FOUND");
      }

      const { page, limit } = normalizePaginationParams(options ?? {});
      const search = options?.search;
      const [data, total] = await Promise.all([
        noticeRepository.findByBoardId(boardId, { page, limit, search }),
        noticeRepository.countByBoardId(boardId, { search }),
      ]);

      return createPaginatedResult(data, total, page, limit);
    },

    async findPinnedAndRecent(
      boardId: string,
      recentCount: number = 3
    ): Promise<NoticeData[]> {
      const board = await boardRepository.findById(boardId);
      if (!board || board.deleted) {
        throw new NoticeServiceError("Board not found", "NOT_FOUND");
      }

      // Get all notices (limited), already ordered by pinned desc, createdAt desc
      const notices = await noticeRepository.findByBoardId(boardId, { limit: 100 });

      // Separate pinned and non-pinned
      const pinned = notices.filter((n) => n.pinned);
      const nonPinned = notices.filter((n) => !n.pinned).slice(0, recentCount);

      // Combine: all pinned + recent non-pinned (up to recentCount)
      return [...pinned, ...nonPinned];
    },

    async findById(id: number): Promise<NoticeData> {
      const notice = await noticeRepository.findById(id);
      if (!notice || notice.deleted) {
        throw new NoticeServiceError("Notice not found", "NOT_FOUND");
      }
      return notice;
    },

    async create(userId: string, data: CreateNoticeInput): Promise<NoticeData> {
      const board = await boardRepository.findById(data.boardId);
      if (!board || board.deleted) {
        throw new NoticeServiceError("Board not found", "NOT_FOUND");
      }

      const hasPermission = await checkPermissions(userId, [
        "notice:create",
        `notice:${data.boardId}:create`,
      ]);
      if (!hasPermission) {
        throw new NoticeServiceError("Permission denied", "FORBIDDEN");
      }

      return noticeRepository.create(data);
    },

    async update(
      userId: string,
      id: number,
      data: UpdateNoticeInput
    ): Promise<NoticeData> {
      const notice = await noticeRepository.findById(id);
      if (!notice) {
        throw new NoticeServiceError("Notice not found", "NOT_FOUND");
      }

      const hasPermission = await checkPermissions(userId, [
        "notice:update",
        `notice:${notice.boardId}:update`,
      ]);
      if (!hasPermission) {
        throw new NoticeServiceError("Permission denied", "FORBIDDEN");
      }

      return noticeRepository.update(id, data);
    },

    async delete(userId: string, id: number): Promise<NoticeData> {
      const notice = await noticeRepository.findById(id);
      if (!notice) {
        throw new NoticeServiceError("Notice not found", "NOT_FOUND");
      }

      const hasPermission = await checkPermissions(userId, [
        "notice:delete",
        `notice:${notice.boardId}:delete`,
      ]);
      if (!hasPermission) {
        throw new NoticeServiceError("Permission denied", "FORBIDDEN");
      }

      return noticeRepository.delete(id);
    },
  };
}

export const noticeService = createNoticeService({
  noticeRepository: defaultNoticeRepository,
  boardRepository: defaultBoardRepository,
  permissionService: defaultPermissionService,
});
