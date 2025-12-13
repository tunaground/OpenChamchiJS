import bcrypt from "bcryptjs";
import {
  permissionService as defaultPermissionService,
  PermissionService,
} from "@/lib/services/permission";
import { threadRepository as defaultThreadRepository } from "@/lib/repositories/prisma/thread";
import { boardRepository as defaultBoardRepository } from "@/lib/repositories/prisma/board";
import {
  ThreadRepository,
  ThreadData,
  ThreadWithResponseCount,
  CreateThreadInput,
  UpdateThreadInput,
} from "@/lib/repositories/interfaces/thread";
import { BoardRepository } from "@/lib/repositories/interfaces/board";
import {
  PaginatedResult,
  PaginationParams,
  normalizePaginationParams,
  createPaginatedResult,
} from "@/lib/types/pagination";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";
import { cached, invalidateCache, CACHE_TAGS } from "@/lib/cache";

export class ThreadServiceError extends ServiceError {
  constructor(
    message: string,
    code: ServiceErrorCode
  ) {
    super(message, code);
    this.name = "ThreadServiceError";
  }
}

export interface FindThreadParams extends PaginationParams {
  search?: string;
  includeDeleted?: boolean;
}

export interface FindByIdOptions {
  includeDeleted?: boolean;
}

export interface ThreadService {
  findByBoardId(
    boardId: string,
    options?: FindThreadParams
  ): Promise<PaginatedResult<ThreadWithResponseCount>>;
  findById(id: number, options?: FindByIdOptions): Promise<ThreadData>;
  create(data: CreateThreadInput): Promise<ThreadData>;
  update(
    userId: string,
    id: number,
    data: UpdateThreadInput
  ): Promise<ThreadData>;
  delete(userId: string, id: number): Promise<ThreadData>;
}

interface ThreadServiceDeps {
  threadRepository: ThreadRepository;
  boardRepository: BoardRepository;
  permissionService: PermissionService;
}

export function createThreadService(deps: ThreadServiceDeps): ThreadService {
  const { threadRepository, boardRepository, permissionService } = deps;

  async function checkThreadPermission(
    userId: string | null,
    boardId: string,
    action: "update" | "delete"
  ): Promise<boolean> {
    if (!userId) return false;

    return permissionService.checkUserPermissions(userId, [
      `thread:${action}`,
      `thread:${boardId}:${action}`,
    ]);
  }

  return {
    async findByBoardId(
      boardId: string,
      options?: FindThreadParams
    ): Promise<PaginatedResult<ThreadWithResponseCount>> {
      const board = await boardRepository.findById(boardId);
      if (!board || board.deleted) {
        throw new ThreadServiceError("Board not found", "NOT_FOUND");
      }

      const { page, limit, offset } = normalizePaginationParams(options ?? {});
      const search = options?.search;
      const includeDeleted = options?.includeDeleted ?? false;
      const [data, total] = await Promise.all([
        threadRepository.findByBoardIdWithResponseCount(boardId, { limit, offset, search, includeDeleted }),
        threadRepository.countByBoardId(boardId, { search, includeDeleted }),
      ]);

      return createPaginatedResult(data, total, page, limit);
    },

    async findById(id: number, options?: FindByIdOptions): Promise<ThreadData> {
      const includeDeleted = options?.includeDeleted ?? false;
      const thread = await cached(
        () => threadRepository.findById(id),
        ["thread", id.toString()],
        [CACHE_TAGS.threads, CACHE_TAGS.thread(id)]
      );
      if (!thread || (!includeDeleted && thread.deleted)) {
        throw new ThreadServiceError("Thread not found", "NOT_FOUND");
      }
      return thread;
    },

    async create(data: CreateThreadInput): Promise<ThreadData> {
      const board = await boardRepository.findById(data.boardId);
      if (!board || board.deleted) {
        throw new ThreadServiceError("Board not found", "NOT_FOUND");
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const thread = await threadRepository.create({
        ...data,
        password: hashedPassword,
      });

      // Invalidate cache
      invalidateCache(CACHE_TAGS.threads);
      invalidateCache(CACHE_TAGS.threadsByBoard(data.boardId));

      return thread;
    },

    async update(
      userId: string,
      id: number,
      data: UpdateThreadInput
    ): Promise<ThreadData> {
      const thread = await threadRepository.findById(id);
      if (!thread) {
        throw new ThreadServiceError("Thread not found", "NOT_FOUND");
      }

      // If thread is deleted, only allow restoring (setting deleted: false)
      if (thread.deleted && data.deleted !== false) {
        throw new ThreadServiceError("Thread not found", "NOT_FOUND");
      }

      const hasPermission = await checkThreadPermission(userId, thread.boardId, "update");
      if (!hasPermission) {
        throw new ThreadServiceError("Permission denied", "FORBIDDEN");
      }

      const result = await threadRepository.update(id, data);

      // Invalidate cache
      invalidateCache(CACHE_TAGS.threads);
      invalidateCache(CACHE_TAGS.threadsByBoard(thread.boardId));
      invalidateCache(CACHE_TAGS.thread(id));

      return result;
    },

    async delete(userId: string, id: number): Promise<ThreadData> {
      const thread = await threadRepository.findById(id);
      if (!thread || thread.deleted) {
        throw new ThreadServiceError("Thread not found", "NOT_FOUND");
      }

      const hasPermission = await checkThreadPermission(userId, thread.boardId, "delete");
      if (!hasPermission) {
        throw new ThreadServiceError("Permission denied", "FORBIDDEN");
      }

      const result = await threadRepository.delete(id);

      // Invalidate cache
      invalidateCache(CACHE_TAGS.threads);
      invalidateCache(CACHE_TAGS.threadsByBoard(thread.boardId));
      invalidateCache(CACHE_TAGS.thread(id));

      return result;
    },
  };
}

export const threadService = createThreadService({
  threadRepository: defaultThreadRepository,
  boardRepository: defaultBoardRepository,
  permissionService: defaultPermissionService,
});
