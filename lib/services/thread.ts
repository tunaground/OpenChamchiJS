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
  CreateThreadInput,
  UpdateThreadInput,
} from "@/lib/repositories/interfaces/thread";
import { BoardRepository } from "@/lib/repositories/interfaces/board";

export class ThreadServiceError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST"
  ) {
    super(message);
    this.name = "ThreadServiceError";
  }
}

export interface ThreadService {
  findByBoardId(
    boardId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ThreadData[]>;
  findById(id: number): Promise<ThreadData>;
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
    action: "edit" | "delete"
  ): Promise<boolean> {
    if (!userId) return false;

    const permissions = [
      "thread:all",
      `thread:${action}`,
      `thread:${boardId}:all`,
      `thread:${boardId}:${action}`,
    ];

    for (const permission of permissions) {
      if (await permissionService.checkUserPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  return {
    async findByBoardId(
      boardId: string,
      options?: { limit?: number; offset?: number }
    ): Promise<ThreadData[]> {
      const board = await boardRepository.findById(boardId);
      if (!board || board.deleted) {
        throw new ThreadServiceError("Board not found", "NOT_FOUND");
      }

      return threadRepository.findByBoardId(boardId, options);
    },

    async findById(id: number): Promise<ThreadData> {
      const thread = await threadRepository.findById(id);
      if (!thread || thread.deleted) {
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
      return threadRepository.create({
        ...data,
        password: hashedPassword,
      });
    },

    async update(
      userId: string,
      id: number,
      data: UpdateThreadInput
    ): Promise<ThreadData> {
      const thread = await threadRepository.findById(id);
      if (!thread || thread.deleted) {
        throw new ThreadServiceError("Thread not found", "NOT_FOUND");
      }

      const hasPermission = await checkThreadPermission(userId, thread.boardId, "edit");
      if (!hasPermission) {
        throw new ThreadServiceError("Permission denied", "FORBIDDEN");
      }

      return threadRepository.update(id, data);
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

      return threadRepository.delete(id);
    },
  };
}

export const threadService = createThreadService({
  threadRepository: defaultThreadRepository,
  boardRepository: defaultBoardRepository,
  permissionService: defaultPermissionService,
});
