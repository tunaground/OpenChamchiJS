import bcrypt from "bcryptjs";
import { createThreadService, ThreadServiceError } from "@/lib/services/thread";
import { RoleService } from "@/lib/services/role";
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

  describe("findByBoardId", () => {
    it("should return threads for a valid board", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService();

      mockBoardRepo.findById.mockResolvedValue(mockBoard);
      mockThreadRepo.findByBoardIdWithCount.mockResolvedValue({
        data: [{ ...mockThread, responseCount: 0 }],
        total: 1,
      });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      const result = await service.findByBoardId("test-board");

      expect(result.data).toHaveLength(1);
      expect(mockBoardRepo.findById).toHaveBeenCalledWith("test-board");
    });

    it("should throw NOT_FOUND when board does not exist", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService();

      mockBoardRepo.findById.mockResolvedValue(null);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      await expect(service.findByBoardId("non-existent")).rejects.toThrow(ThreadServiceError);
      await expect(service.findByBoardId("non-existent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when board is deleted", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService();

      mockBoardRepo.findById.mockResolvedValue({ ...mockBoard, deleted: true });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
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
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(mockThread);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      const result = await service.findById(1);

      expect(result).toEqual(mockThread);
      expect(mockThreadRepo.findById).toHaveBeenCalledWith(1);
    });

    it("should throw NOT_FOUND when thread does not exist", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(null);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      await expect(service.findById(999)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when thread is deleted", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue({ ...mockThread, deleted: true });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      await expect(service.findById(1)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when boardId does not match the thread's board", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(mockThread); // boardId: "test-board"

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      await expect(
        service.findById(1, { boardId: "wrong-board" })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should return thread when boardId matches the thread's board", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(mockThread); // boardId: "test-board"

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      const result = await service.findById(1, { boardId: "test-board" });

      expect(result).toEqual(mockThread);
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
      const mockRoleService = createMockRoleService();

      mockBoardRepo.findById.mockResolvedValue(mockBoard);
      mockThreadRepo.create.mockResolvedValue({ ...mockThread, ...createInput, id: 2 });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
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
      const mockRoleService = createMockRoleService();

      mockBoardRepo.findById.mockResolvedValue(null);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      await expect(service.create(createInput)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(mockThreadRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const updateInput = { title: "Updated Title" };

    it("should update thread when user can manage the board", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(true),
      });

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockThreadRepo.update.mockResolvedValue({ ...mockThread, ...updateInput });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      const result = await service.update("user-1", 1, updateInput);

      expect(result.title).toBe("Updated Title");
      expect(mockThreadRepo.update).toHaveBeenCalledWith(1, updateInput);
    });

    it("should throw FORBIDDEN when user has no permission", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(false),
      });

      mockThreadRepo.findById.mockResolvedValue(mockThread);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      await expect(service.update("user-1", 1, updateInput)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(mockThreadRepo.update).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when thread does not exist", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(null);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      await expect(service.update("user-1", 999, updateInput)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("checks the board admin role for the thread's board", async () => {
      const threadRepository = createMockThreadRepo();
      threadRepository.findById.mockResolvedValue({ id: 1, boardId: "free" } as ThreadData);
      threadRepository.update.mockResolvedValue({ id: 1, boardId: "free" } as ThreadData);
      const roleService = createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(true),
      });
      const service = createThreadService({
        threadRepository,
        boardRepository: createMockBoardRepo(),
        roleService,
      });

      await service.update("u1", 1, { title: "새 제목" });

      expect(roleService.canManageBoard).toHaveBeenCalledWith("u1", "free");
    });
  });

  describe("delete", () => {
    it("should delete thread when user can manage the board", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(true),
      });

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockThreadRepo.delete.mockResolvedValue({ ...mockThread, deleted: true });

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      const result = await service.delete("user-1", 1);

      expect(result.deleted).toBe(true);
      expect(mockThreadRepo.delete).toHaveBeenCalledWith(1);
    });

    it("should throw FORBIDDEN when user has no permission", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(false),
      });

      mockThreadRepo.findById.mockResolvedValue(mockThread);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      await expect(service.delete("user-1", 1)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(mockThreadRepo.delete).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when thread does not exist", async () => {
      const mockThreadRepo = createMockThreadRepo();
      const mockBoardRepo = createMockBoardRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(null);

      const service = createThreadService({
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      await expect(service.delete("user-1", 999)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("forbids deleting a thread on a board the user does not manage", async () => {
      const threadRepository = createMockThreadRepo();
      threadRepository.findById.mockResolvedValue({ id: 1, boardId: "free" } as ThreadData);
      const service = createThreadService({
        threadRepository,
        boardRepository: createMockBoardRepo(),
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(service.delete("u1", 1)).rejects.toThrow("Permission denied");
    });
  });
});
