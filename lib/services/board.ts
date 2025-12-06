import {
  permissionService as defaultPermissionService,
  PermissionService,
} from "@/lib/services/permission";
import { boardRepository as defaultBoardRepository } from "@/lib/repositories/prisma/board";
import {
  BoardRepository,
  BoardData,
  CreateBoardInput,
  UpdateBoardInput,
  ConfigBoardInput,
} from "@/lib/repositories/interfaces/board";

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
}

export function createBoardService(deps: BoardServiceDeps): BoardService {
  const { boardRepository, permissionService } = deps;

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

      return boardRepository.create(data);
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
});
