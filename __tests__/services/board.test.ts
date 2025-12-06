import { createBoardService, BoardServiceError } from "@/lib/services/board";
import { PermissionService } from "@/lib/services/permission";
import { BoardRepository, BoardData } from "@/lib/repositories/interfaces/board";

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

  const createMockRepo = (): jest.Mocked<BoardRepository> => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateConfig: jest.fn(),
  });

  const createMockPermission = (): jest.Mocked<PermissionService> => ({
    getUserPermissions: jest.fn(),
    hasPermission: jest.fn(),
    checkUserPermission: jest.fn(),
  });

  describe("findAll", () => {
    it("should return all boards", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockRepo.findAll.mockResolvedValue([mockBoard]);

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      const result = await service.findAll();

      expect(result).toEqual([mockBoard]);
      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("findById", () => {
    it("should return board when found", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockRepo.findById.mockResolvedValue(mockBoard);

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      const result = await service.findById("test-board");

      expect(result).toEqual(mockBoard);
      expect(mockRepo.findById).toHaveBeenCalledWith("test-board");
    });

    it("should throw NOT_FOUND when board does not exist", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockRepo.findById.mockResolvedValue(null);

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      await expect(service.findById("non-existent")).rejects.toThrow(
        BoardServiceError
      );
      await expect(service.findById("non-existent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when board is deleted", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockRepo.findById.mockResolvedValue({ ...mockBoard, deleted: true });

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      await expect(service.findById("test-board")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("create", () => {
    const createInput = { id: "new-board", name: "New Board" };

    it("should create board when user has board:write permission", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockPermission.checkUserPermission.mockImplementation(
        async (_, permission) => permission === "board:write"
      );
      mockRepo.findById.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ ...mockBoard, ...createInput });

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      const result = await service.create("user-1", createInput);

      expect(result.id).toBe("new-board");
      expect(mockRepo.create).toHaveBeenCalledWith(createInput);
    });

    it("should create board when user has board:all permission", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockPermission.checkUserPermission.mockImplementation(
        async (_, permission) => permission === "board:all"
      );
      mockRepo.findById.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ ...mockBoard, ...createInput });

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      const result = await service.create("user-1", createInput);

      expect(result.id).toBe("new-board");
    });

    it("should throw FORBIDDEN when user has no permission", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockPermission.checkUserPermission.mockResolvedValue(false);

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      await expect(service.create("user-1", createInput)).rejects.toMatchObject(
        { code: "FORBIDDEN" }
      );
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should throw CONFLICT when board already exists", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockPermission.checkUserPermission.mockResolvedValue(true);
      mockRepo.findById.mockResolvedValue(mockBoard);

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      await expect(
        service.create("user-1", { id: "test-board", name: "Duplicate" })
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });
  });

  describe("update", () => {
    const updateInput = { name: "Updated Board" };

    it("should update board when user has board:edit permission", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockPermission.checkUserPermission.mockImplementation(
        async (_, permission) => permission === "board:edit"
      );
      mockRepo.findById.mockResolvedValue(mockBoard);
      mockRepo.update.mockResolvedValue({ ...mockBoard, ...updateInput });

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      const result = await service.update("user-1", "test-board", updateInput);

      expect(result.name).toBe("Updated Board");
      expect(mockRepo.update).toHaveBeenCalledWith("test-board", updateInput);
    });

    it("should throw FORBIDDEN when user has no permission", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockPermission.checkUserPermission.mockResolvedValue(false);

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      await expect(
        service.update("user-1", "test-board", updateInput)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("should throw NOT_FOUND when board does not exist", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockPermission.checkUserPermission.mockResolvedValue(true);
      mockRepo.findById.mockResolvedValue(null);

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      await expect(
        service.update("user-1", "non-existent", updateInput)
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("updateConfig", () => {
    const configInput = { threadsPerPage: 30 };

    it("should update config when user has board:config permission", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockPermission.checkUserPermission.mockImplementation(
        async (_, permission) => permission === "board:config"
      );
      mockRepo.findById.mockResolvedValue(mockBoard);
      mockRepo.updateConfig.mockResolvedValue({
        ...mockBoard,
        ...configInput,
      });

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      const result = await service.updateConfig(
        "user-1",
        "test-board",
        configInput
      );

      expect(result.threadsPerPage).toBe(30);
      expect(mockRepo.updateConfig).toHaveBeenCalledWith(
        "test-board",
        configInput
      );
    });

    it("should update config when user has board:edit permission", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockPermission.checkUserPermission.mockImplementation(
        async (_, permission) => permission === "board:edit"
      );
      mockRepo.findById.mockResolvedValue(mockBoard);
      mockRepo.updateConfig.mockResolvedValue({
        ...mockBoard,
        ...configInput,
      });

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      const result = await service.updateConfig(
        "user-1",
        "test-board",
        configInput
      );

      expect(result.threadsPerPage).toBe(30);
    });

    it("should throw FORBIDDEN when user has no permission", async () => {
      const mockRepo = createMockRepo();
      const mockPermission = createMockPermission();
      mockPermission.checkUserPermission.mockResolvedValue(false);

      const service = createBoardService({
        boardRepository: mockRepo,
        permissionService: mockPermission,
      });

      await expect(
        service.updateConfig("user-1", "test-board", configInput)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});
