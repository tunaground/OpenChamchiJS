import bcrypt from "bcryptjs";
import { createThreadService, ThreadServiceError } from "@/lib/services/thread";
import { PermissionService } from "@/lib/services/permission";
import { ThreadRepository, ThreadData } from "@/lib/repositories/interfaces/thread";
import { BoardRepository, BoardData } from "@/lib/repositories/interfaces/board";

jest.mock("bcryptjs");

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("ThreadService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBcrypt.hash.mockImplementation((password: string) =>
      Promise.resolve(`hashed_${password}`)
    );
  });

  const mockBoard: BoardData = {
    id: "test-board",
    name: "Test Board",
    deleted: false,
    maxResponsesPerThread: 1000,
    blockForeignIp: false,
    responsesPerPage: 50,
    showUserCount: false,
    threadsPerPage: 20,
    threadCount: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockThread: ThreadData = {
    id: 1,
    boardId: "test-board",
    title: "Test Thread",
    password: "hashed_test-password",
    username: "testuser",
    ended: false,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    top: false,
  };

  const createMockThreadRepo = (): jest.Mocked<ThreadRepository> => ({
    findByBoardId: jest.fn(),
    findByBoardIdWithResponseCount: jest.fn(),
    findByBoardIdWithCount: jest.fn(),
    countByBoardId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateBumpTime: jest.fn(),
  });

  const createMockBoardRepo = (): jest.Mocked<BoardRepository> => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateConfig: jest.fn(),
  });

  const createMockPermission = (): jest.Mocked<PermissionService> => ({
    getUserPermissions: jest.fn(),
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    checkUserPermission: jest.fn(),
    checkUserPermissions: jest.fn(),
  });

  describe("findByBoardId", () => {
    it("should return threads for a valid board", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockBoardRepo.findById.mockResolvedValue(mockBoard);
      mockThreadRepo.findByBoardIdWithCount.mockResolvedValue({
        data: [{ ...mockThread, responseCount: 0 }],
        total: 1,
      });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      const result = await service.findByBoardId("test-board");

      expect(result.data).toHaveLength(1);
      expect(mockBoardRepo.findById).toHaveBeenCalledWith("test-board");
    });

    it("should throw NOT_FOUND when board does not exist", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockBoardRepo.findById.mockResolvedValue(null);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      await expect(service.findByBoardId("non-existent")).rejects.toThrow(ThreadServiceError);
      await expect(service.findByBoardId("non-existent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when board is deleted", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockBoardRepo.findById.mockResolvedValue({ ...mockBoard, deleted: true });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      await expect(service.findByBoardId("test-board")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("findById", () => {
    it("should return thread when found", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(mockThread);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      const result = await service.findById(1);

      expect(result).toEqual(mockThread);
      expect(mockThreadRepo.findById).toHaveBeenCalledWith(1);
    });

    it("should throw NOT_FOUND when thread does not exist", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(null);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      await expect(service.findById(999)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when thread is deleted", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue({ ...mockThread, deleted: true });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      await expect(service.findById(1)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("create", () => {
    const createInput = {
      boardId: "test-board",
      title: "New Thread",
      password: "password123",
      username: "newuser",
    };

    it("should create thread with hashed password when board exists", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockBoardRepo.findById.mockResolvedValue(mockBoard);
      mockThreadRepo.create.mockResolvedValue({ ...mockThread, ...createInput, id: 2 });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      const result = await service.create(createInput);

      expect(result.title).toBe("New Thread");
      expect(mockThreadRepo.create).toHaveBeenCalledWith({
        ...createInput,
        password: "hashed_password123",
      });
    });

    it("should throw NOT_FOUND when board does not exist", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockBoardRepo.findById.mockResolvedValue(null);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      await expect(service.create(createInput)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(mockThreadRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const updateInput = { title: "Updated Title" };

    it("should update thread when user has thread:all permission", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermissions.mockResolvedValue(true);
      mockThreadRepo.update.mockResolvedValue({ ...mockThread, ...updateInput });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      const result = await service.update("user-1", 1, updateInput);

      expect(result.title).toBe("Updated Title");
      expect(mockThreadRepo.update).toHaveBeenCalledWith(1, updateInput);
    });

    it("should update thread when user has thread:edit permission", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermissions.mockResolvedValue(true);
      mockThreadRepo.update.mockResolvedValue({ ...mockThread, ...updateInput });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      const result = await service.update("user-1", 1, updateInput);

      expect(result.title).toBe("Updated Title");
    });

    it("should update thread when user has board-specific permission", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermissions.mockResolvedValue(true);
      mockThreadRepo.update.mockResolvedValue({ ...mockThread, ...updateInput });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      const result = await service.update("user-1", 1, updateInput);

      expect(result.title).toBe("Updated Title");
    });

    it("should throw FORBIDDEN when user has no permission", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermissions.mockResolvedValue(false);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      await expect(service.update("user-1", 1, updateInput)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(mockThreadRepo.update).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when thread does not exist", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(null);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      await expect(service.update("user-1", 999, updateInput)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("delete", () => {
    it("should delete thread when user has thread:delete permission", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermissions.mockResolvedValue(true);
      mockThreadRepo.delete.mockResolvedValue({ ...mockThread, deleted: true });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      const result = await service.delete("user-1", 1);

      expect(result.deleted).toBe(true);
      expect(mockThreadRepo.delete).toHaveBeenCalledWith(1);
    });

    it("should delete thread when user has board-specific delete permission", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermissions.mockResolvedValue(true);
      mockThreadRepo.delete.mockResolvedValue({ ...mockThread, deleted: true });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      const result = await service.delete("user-1", 1);

      expect(result.deleted).toBe(true);
    });

    it("should throw FORBIDDEN when user has no permission", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermissions.mockResolvedValue(false);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      await expect(service.delete("user-1", 1)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(mockThreadRepo.delete).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when thread does not exist", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(null);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        permissionService: mockPermission,
      });

      await expect(service.delete("user-1", 999)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });
});
