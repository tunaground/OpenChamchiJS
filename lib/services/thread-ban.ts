import {
  permissionService as defaultPermissionService,
  PermissionService,
} from "@/lib/services/permission";
import { threadBanRepository as defaultThreadBanRepository } from "@/lib/repositories/prisma/thread-ban";
import { threadRepository as defaultThreadRepository } from "@/lib/repositories/prisma/thread";
import {
  ThreadBanRepository,
  ThreadBanData,
} from "@/lib/repositories/interfaces/thread-ban";
import { ThreadRepository } from "@/lib/repositories/interfaces/thread";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";

export class ThreadBanServiceError extends ServiceError {
  constructor(message: string, code: ServiceErrorCode) {
    super(message, code);
    this.name = "ThreadBanServiceError";
  }
}

export interface ThreadBanService {
  findByThreadId(userId: string, threadId: number): Promise<ThreadBanData[]>;
  findByThreadIdDirect(threadId: number): Promise<ThreadBanData[]>;
  isBanned(threadId: number, authorId: string): Promise<boolean>;
  createBans(
    adminUserId: string,
    threadId: number,
    authorIds: string[]
  ): Promise<ThreadBanData[]>;
  createBansDirect(threadId: number, authorIds: string[]): Promise<ThreadBanData[]>;
  deleteBan(adminUserId: string, banId: string): Promise<ThreadBanData>;
  deleteBanDirect(banId: string): Promise<ThreadBanData>;
}

interface ThreadBanServiceDeps {
  threadBanRepository: ThreadBanRepository;
  threadRepository: ThreadRepository;
  permissionService: PermissionService;
}

export function createThreadBanService(
  deps: ThreadBanServiceDeps
): ThreadBanService {
  const { threadBanRepository, threadRepository, permissionService } = deps;

  async function getThread(threadId: number) {
    const thread = await threadRepository.findById(threadId);
    if (!thread) {
      throw new ThreadBanServiceError("Thread not found", "NOT_FOUND");
    }
    return thread;
  }

  async function checkPermissions(
    userId: string,
    boardId: string
  ): Promise<void> {
    const hasPermission = await permissionService.checkUserPermissions(userId, [
      "response:delete",
      `response:${boardId}:delete`,
    ]);
    if (!hasPermission) {
      throw new ThreadBanServiceError("Permission denied", "FORBIDDEN");
    }
  }

  return {
    async findByThreadId(
      userId: string,
      threadId: number
    ): Promise<ThreadBanData[]> {
      const thread = await getThread(threadId);
      await checkPermissions(userId, thread.boardId);
      return threadBanRepository.findByThreadId(threadId);
    },

    async findByThreadIdDirect(threadId: number): Promise<ThreadBanData[]> {
      await getThread(threadId);
      return threadBanRepository.findByThreadId(threadId);
    },

    async isBanned(threadId: number, authorId: string): Promise<boolean> {
      return threadBanRepository.isBanned(threadId, authorId);
    },

    async createBans(
      adminUserId: string,
      threadId: number,
      authorIds: string[]
    ): Promise<ThreadBanData[]> {
      if (authorIds.length === 0) {
        throw new ThreadBanServiceError(
          "At least one authorId is required",
          "BAD_REQUEST"
        );
      }

      const thread = await getThread(threadId);
      await checkPermissions(adminUserId, thread.boardId);

      const uniqueAuthorIds = [...new Set(authorIds)];
      const bans = await threadBanRepository.createMany(
        uniqueAuthorIds.map((authorId) => ({ threadId, authorId }))
      );

      return bans;
    },

    async createBansDirect(
      threadId: number,
      authorIds: string[]
    ): Promise<ThreadBanData[]> {
      if (authorIds.length === 0) {
        throw new ThreadBanServiceError(
          "At least one authorId is required",
          "BAD_REQUEST"
        );
      }

      await getThread(threadId);

      const uniqueAuthorIds = [...new Set(authorIds)];
      const bans = await threadBanRepository.createMany(
        uniqueAuthorIds.map((authorId) => ({ threadId, authorId }))
      );

      return bans;
    },

    async deleteBan(
      adminUserId: string,
      banId: string
    ): Promise<ThreadBanData> {
      const ban = await threadBanRepository.findById(banId);
      if (!ban) {
        throw new ThreadBanServiceError("Ban not found", "NOT_FOUND");
      }

      const thread = await getThread(ban.threadId);
      await checkPermissions(adminUserId, thread.boardId);

      const result = await threadBanRepository.delete(banId);

      return result;
    },

    async deleteBanDirect(banId: string): Promise<ThreadBanData> {
      const ban = await threadBanRepository.findById(banId);
      if (!ban) {
        throw new ThreadBanServiceError("Ban not found", "NOT_FOUND");
      }

      await getThread(ban.threadId);

      const result = await threadBanRepository.delete(banId);

      return result;
    },
  };
}

export const threadBanService = createThreadBanService({
  threadBanRepository: defaultThreadBanRepository,
  threadRepository: defaultThreadRepository,
  permissionService: defaultPermissionService,
});
