import {
  roleService as defaultRoleService,
  RoleService,
} from "@/lib/services/role";
import { boardRepository as defaultBoardRepository } from "@/lib/repositories/prisma/board";
import {
  BoardRepository,
  BoardData,
  BoardWithThreadCount,
  CreateBoardInput,
  UpdateBoardInput,
  ConfigBoardInput,
} from "@/lib/repositories/interfaces/board";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";
import { cached, invalidateCache, CACHE_TAGS } from "@/lib/cache";

export class BoardServiceError extends ServiceError {
  constructor(
    message: string,
    code: ServiceErrorCode
  ) {
    super(message, code);
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
  roleService: RoleService;
}

export function createBoardService(deps: BoardServiceDeps): BoardService {
  const { boardRepository, roleService } = deps;

  return {
    async findAll(): Promise<BoardData[]> {
      return cached(
        () => boardRepository.findAll(),
        ["boards"],
        [CACHE_TAGS.boards]
      );
    },

    async findAllWithThreadCount(userId: string): Promise<BoardWithThreadCount[]> {
      const managed = await roleService.listManagedBoardIds(userId);
      if (managed !== "all" && managed.length === 0) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      const boards = await cached(
        () => boardRepository.findAllWithThreadCount(),
        ["boards-with-count"],
        [CACHE_TAGS.boards]
      );

      if (managed === "all") return boards;
      return boards.filter((board) => managed.includes(board.id));
    },

    async findById(id: string): Promise<BoardData> {
      const board = await cached(
        () => boardRepository.findById(id),
        ["board", id],
        [CACHE_TAGS.boards, CACHE_TAGS.board(id)]
      );
      if (!board || board.deleted) {
        throw new BoardServiceError("Board not found", "NOT_FOUND");
      }
      return board;
    },

    async create(userId: string, data: CreateBoardInput): Promise<BoardData> {
      if (!(await roleService.isAdmin(userId))) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      const existingBoard = await boardRepository.findById(data.id);
      if (existingBoard) {
        throw new BoardServiceError("Board already exists", "CONFLICT");
      }

      const board = await boardRepository.create(data);

      invalidateCache(CACHE_TAGS.boards);

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

      if (!(await roleService.canManageBoard(userId, id))) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      // 보드 삭제/복구는 시스템 어드민 전용
      if (data.deleted !== undefined && !(await roleService.isAdmin(userId))) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      const result = await boardRepository.update(id, data);

      invalidateCache(CACHE_TAGS.boards);
      invalidateCache(CACHE_TAGS.board(id));

      return result;
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

      if (!(await roleService.canManageBoard(userId, id))) {
        throw new BoardServiceError("Permission denied", "FORBIDDEN");
      }

      const result = await boardRepository.updateConfig(id, data);

      invalidateCache(CACHE_TAGS.boards);
      invalidateCache(CACHE_TAGS.board(id));

      return result;
    },
  };
}

export const boardService = createBoardService({
  boardRepository: defaultBoardRepository,
  roleService: defaultRoleService,
});
