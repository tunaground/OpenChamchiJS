import { createBoardService, BoardServiceError } from "@/lib/services/board";
import { RoleService } from "@/lib/services/role";
import { BoardData } from "@/lib/repositories/interfaces/board";

describe("BoardService", () => {
  const mockBoard: BoardData = {
    id: "test-board",
    name: "Test Board",
    deleted: false,
    maxResponsesPerThread: 1000,
    blockForeignIp: false,
    responsesPerPage: 50,
    showUserCount: false,
    threadsPerPage: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockBoardRepository = () => ({
    findAll: jest.fn(),
    findAllWithThreadCount: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateConfig: jest.fn(),
  });

  const createMockRoleService = (
    overrides: Partial<jest.Mocked<RoleService>> = {}
  ): jest.Mocked<RoleService> => ({
    getUserRoles: jest.fn().mockResolvedValue([]),
    isAdmin: jest.fn().mockResolvedValue(false),
    isVerified: jest.fn().mockResolvedValue(false),
    canManageBoard: jest.fn().mockResolvedValue(false),
    listManagedBoardIds: jest.fn().mockResolvedValue([]),
    ...overrides,
  });

  describe("findAll", () => {
    it("should return all boards", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findAll.mockResolvedValue([mockBoard]);

      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService(),
      });

      const result = await service.findAll();

      expect(result).toEqual([mockBoard]);
      expect(boardRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("findById", () => {
    it("should return board when found", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue(mockBoard);

      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService(),
      });

      const result = await service.findById("test-board");

      expect(result).toEqual(mockBoard);
      expect(boardRepository.findById).toHaveBeenCalledWith("test-board");
    });

    it("should throw NOT_FOUND when board does not exist", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue(null);

      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService(),
      });

      await expect(service.findById("non-existent")).rejects.toThrow(
        BoardServiceError
      );
      await expect(service.findById("non-existent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when board is deleted", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue({ ...mockBoard, deleted: true });

      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService(),
      });

      await expect(service.findById("test-board")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("create", () => {
    const createInput = { id: "new-board", name: "New Board" };

    it("should create board when user is admin", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue(null);
      boardRepository.create.mockResolvedValue({ ...mockBoard, ...createInput });

      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          isAdmin: jest.fn().mockResolvedValue(true),
        }),
      });

      const result = await service.create("admin", createInput);

      expect(result.id).toBe("new-board");
      expect(boardRepository.create).toHaveBeenCalledWith(createInput);
    });

    it("forbids a board admin from creating a board", async () => {
      const service = createBoardService({
        boardRepository: createMockBoardRepository(),
        roleService: createMockRoleService({
          isAdmin: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(service.create("u1", { id: "new" })).rejects.toThrow(
        "Permission denied"
      );
    });

    it("should throw CONFLICT when board already exists", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue(mockBoard);

      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          isAdmin: jest.fn().mockResolvedValue(true),
        }),
      });

      await expect(
        service.create("admin", { id: "test-board", name: "Duplicate" })
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });
  });

  describe("update", () => {
    const updateInput = { name: "Updated Board" };

    it("lets a board admin update a normal field", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue({ id: "free", deleted: false });
      boardRepository.update.mockResolvedValue({ id: "free", deleted: false });
      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(true),
        }),
      });

      await expect(
        service.update("u1", "free", { name: "새 이름" })
      ).resolves.toEqual({ id: "free", deleted: false });
    });

    it("forbids a board admin from deleting the board", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue({ id: "free", deleted: false });
      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(true),
          isAdmin: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(service.update("u1", "free", { deleted: true })).rejects.toThrow(
        "Permission denied"
      );
      expect(boardRepository.update).not.toHaveBeenCalled();
    });

    it("lets an admin delete the board", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue({ id: "free", deleted: false });
      boardRepository.update.mockResolvedValue({ id: "free", deleted: true });
      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(true),
          isAdmin: jest.fn().mockResolvedValue(true),
        }),
      });

      await expect(
        service.update("admin", "free", { deleted: true })
      ).resolves.toEqual({ id: "free", deleted: true });
    });

    it("forbids a board admin from restoring a board", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue({ id: "free", deleted: true });
      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(true),
          isAdmin: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(
        service.update("u1", "free", { deleted: false })
      ).rejects.toThrow("Permission denied");
    });

    it("should throw FORBIDDEN when user cannot manage the board", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue(mockBoard);

      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(
        service.update("user-1", "test-board", updateInput)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("should throw NOT_FOUND when board does not exist", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue(null);

      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(true),
        }),
      });

      await expect(
        service.update("user-1", "non-existent", updateInput)
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("updateConfig", () => {
    const configInput = { threadsPerPage: 30 };

    it("should update config when user can manage the board", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue(mockBoard);
      boardRepository.updateConfig.mockResolvedValue({
        ...mockBoard,
        ...configInput,
      });

      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(true),
        }),
      });

      const result = await service.updateConfig(
        "user-1",
        "test-board",
        configInput
      );

      expect(result.threadsPerPage).toBe(30);
      expect(boardRepository.updateConfig).toHaveBeenCalledWith(
        "test-board",
        configInput
      );
    });

    it("should throw FORBIDDEN when user cannot manage the board", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findById.mockResolvedValue(mockBoard);

      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(
        service.updateConfig("user-1", "test-board", configInput)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("findAllWithThreadCount", () => {
    it("returns every board for an admin", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findAllWithThreadCount.mockResolvedValue([
        { id: "a" },
        { id: "b" },
      ]);
      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          listManagedBoardIds: jest.fn().mockResolvedValue("all"),
        }),
      });

      await expect(service.findAllWithThreadCount("admin")).resolves.toEqual([
        { id: "a" },
        { id: "b" },
      ]);
    });

    it("returns only managed boards for a board admin", async () => {
      const boardRepository = createMockBoardRepository();
      boardRepository.findAllWithThreadCount.mockResolvedValue([
        { id: "a" },
        { id: "b" },
      ]);
      const service = createBoardService({
        boardRepository,
        roleService: createMockRoleService({
          listManagedBoardIds: jest.fn().mockResolvedValue(["b"]),
        }),
      });

      await expect(service.findAllWithThreadCount("u1")).resolves.toEqual([
        { id: "b" },
      ]);
    });

    it("forbids a user who manages no boards", async () => {
      const service = createBoardService({
        boardRepository: createMockBoardRepository(),
        roleService: createMockRoleService({
          listManagedBoardIds: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.findAllWithThreadCount("u1")).rejects.toThrow(
        "Permission denied"
      );
    });
  });
});
