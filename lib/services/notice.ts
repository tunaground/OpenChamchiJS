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

export class NoticeServiceError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND"
  ) {
    super(message);
    this.name = "NoticeServiceError";
  }
}

export interface NoticeService {
  findByBoardId(boardId: string): Promise<NoticeData[]>;
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
    for (const permission of permissions) {
      if (await permissionService.checkUserPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  return {
    async findByBoardId(boardId: string): Promise<NoticeData[]> {
      const board = await boardRepository.findById(boardId);
      if (!board || board.deleted) {
        throw new NoticeServiceError("Board not found", "NOT_FOUND");
      }
      return noticeRepository.findByBoardId(boardId);
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
