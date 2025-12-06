import {
  permissionService as defaultPermissionService,
  PermissionService,
} from "@/lib/services/permission";
import { boardRepository as defaultBoardRepository } from "@/lib/repositories/prisma/board";
import { permissionRepository as defaultPermissionRepository } from "@/lib/repositories/prisma/permission";
import {
  BoardRepository,
  BoardData,
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
      {
        name: `thread:${boardId}:all`,
        description: `${boardId} 보드의 스레드 전체 권한`,
      },
      {
        name: `thread:${boardId}:edit`,
        description: `${boardId} 보드의 스레드 수정`,
      },
      {
        name: `thread:${boardId}:delete`,
        description: `${boardId} 보드의 스레드 삭제`,
      },
    ]);
  }

  return {
    async findAll(): Promise<BoardData[]> {
      return boardRepository.findAll();
    },

    async findById(id: string): Promise<BoardData> {
      const board = await boardRepository.findById(id);
      if (!board || board.deleted) {
        throw new BoardServiceError("Board not found", "NOT_FOUND");
      }
      return board;
    },

    async create(userId: string, data: CreateBoardInput): Promise<BoardData> {
      const hasPermission = await checkPermissions(userId, [
        "board:all",
        "board:write",
      ]);
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
      const hasPermission = await checkPermissions(userId, [
        "board:all",
        "board:edit",
      ]);
      if (!hasPermission) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      const board = await boardRepository.findById(id);
      if (!board) {
        throw new BoardServiceError("Board not found", "NOT_FOUND");
      }

      return boardRepository.update(id, data);
    },

    async updateConfig(
      userId: string,
      id: string,
      data: ConfigBoardInput
    ): Promise<BoardData> {
      const hasPermission = await checkPermissions(userId, [
        "board:all",
        "board:edit",
        "board:config",
      ]);
      if (!hasPermission) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      const board = await boardRepository.findById(id);
      if (!board) {
        throw new BoardServiceError("Board not found", "NOT_FOUND");
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
