import {
  permissionService as defaultPermissionService,
  PermissionService,
} from "@/lib/services/permission";
import { boardRepository as defaultBoardRepository } from "@/lib/repositories/prisma/board";
import { permissionRepository as defaultPermissionRepository } from "@/lib/repositories/prisma/permission";
import {
  BoardRepository,
  BoardData,
  BoardWithThreadCount,
  CreateBoardInput,
  UpdateBoardInput,
  ConfigBoardInput,
} from "@/lib/repositories/interfaces/board";
import { PermissionRepository } from "@/lib/repositories/interfaces/permission";

export class BoardServiceError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT"
  ) {
    super(message);
    this.name = "BoardServiceError";
  }
}

export interface BoardService {
  findAll(): Promise<BoardData[]>;
  findAllWithThreadCount(userId: string): Promise<BoardWithThreadCount[]>;
  findById(id: string): Promise<BoardData>;
  create(userId: string, data: CreateBoardInput): Promise<BoardData>;
  update(userId: string, id: string, data: UpdateBoardInput): Promise<BoardData>;
  updateConfig(userId: string, id: string, data: ConfigBoardInput): Promise<BoardData>;
}

interface BoardServiceDeps {
  boardRepository: BoardRepository;
  permissionService: PermissionService;
  permissionRepository: PermissionRepository;
}

export function createBoardService(deps: BoardServiceDeps): BoardService {
  const { boardRepository, permissionService, permissionRepository } = deps;

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

  async function createBoardPermissions(boardId: string): Promise<void> {
    await permissionRepository.createMany([
      // 보드 권한
      {
        name: `board:${boardId}:update`,
        description: `${boardId} 보드 수정`,
      },
      {
        name: `board:${boardId}:delete`,
        description: `${boardId} 보드 삭제`,
      },
      // 공지 권한
      {
        name: `notice:${boardId}:create`,
        description: `${boardId} 보드 공지 생성`,
      },
      {
        name: `notice:${boardId}:update`,
        description: `${boardId} 보드 공지 수정`,
      },
      {
        name: `notice:${boardId}:delete`,
        description: `${boardId} 보드 공지 삭제`,
      },
      // 스레드 권한
      {
        name: `thread:${boardId}:update`,
        description: `${boardId} 보드 스레드 수정`,
      },
      {
        name: `thread:${boardId}:delete`,
        description: `${boardId} 보드 스레드 삭제`,
      },
      // 응답 권한
      {
        name: `response:${boardId}:update`,
        description: `${boardId} 보드 응답 수정`,
      },
      {
        name: `response:${boardId}:delete`,
        description: `${boardId} 보드 응답 삭제`,
      },
    ]);
  }

  return {
    async findAll(): Promise<BoardData[]> {
      return boardRepository.findAll();
    },

    async findAllWithThreadCount(userId: string): Promise<BoardWithThreadCount[]> {
      const hasPermission = await checkPermissions(userId, ["board:read"]);
      if (!hasPermission) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }
      return boardRepository.findAllWithThreadCount();
    },

    async findById(id: string): Promise<BoardData> {
      const board = await boardRepository.findById(id);
      if (!board || board.deleted) {
        throw new BoardServiceError("Board not found", "NOT_FOUND");
      }
      return board;
    },

    async create(userId: string, data: CreateBoardInput): Promise<BoardData> {
      const hasPermission = await checkPermissions(userId, ["board:create"]);
      if (!hasPermission) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      const existingBoard = await boardRepository.findById(data.id);
      if (existingBoard) {
        throw new BoardServiceError("Board already exists", "CONFLICT");
      }

      const board = await boardRepository.create(data);
      await createBoardPermissions(board.id);

      return board;
    },

    async update(
      userId: string,
      id: string,
      data: UpdateBoardInput
    ): Promise<BoardData> {
      const board = await boardRepository.findById(id);
      if (!board) {
        throw new BoardServiceError("Board not found", "NOT_FOUND");
      }

      const hasPermission = await checkPermissions(userId, [
        "board:update",
        `board:${id}:update`,
      ]);
      if (!hasPermission) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      return boardRepository.update(id, data);
    },

    async updateConfig(
      userId: string,
      id: string,
      data: ConfigBoardInput
    ): Promise<BoardData> {
      const board = await boardRepository.findById(id);
      if (!board) {
        throw new BoardServiceError("Board not found", "NOT_FOUND");
      }

      const hasPermission = await checkPermissions(userId, [
        "board:update",
        `board:${id}:update`,
      ]);
      if (!hasPermission) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      return boardRepository.updateConfig(id, data);
    },
  };
}

export const boardService = createBoardService({
  boardRepository: defaultBoardRepository,
  permissionService: defaultPermissionService,
  permissionRepository: defaultPermissionRepository,
});
