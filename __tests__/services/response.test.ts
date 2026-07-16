import bcrypt from "bcryptjs";
import { createResponseService } from "@/lib/services/response";
import { RoleService } from "@/lib/services/role";
import { ResponseRepository, ResponseData } from "@/lib/repositories/interfaces/response";
import { ThreadRepository, ThreadData } from "@/lib/repositories/interfaces/thread";
import { BoardRepository, BoardData } from "@/lib/repositories/interfaces/board";

jest.mock("bcryptjs");

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("ResponseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBcrypt.compare.mockImplementation((password: string, hash: string) =>
      Promise.resolve(hash === `hashed_${password}`)
    );
  });

  const mockBoard: BoardData = {
    id: "test-board",
    name: "Test Board",
    threadsPerPage: 20,
    responsesPerPage: 50,
    maxResponsesPerThread: 1000,
    blockForeignIp: false,
    deleted: false,
    defaultUsername: "anonymous",
    showUserCount: false,
    uploadMaxSize: 5242880,
    uploadMimeTypes: "image/png,image/jpeg,image/gif,image/webp",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockThread: ThreadData = {
    id: 1,
    boardId: "test-board",
    title: "Test Thread",
    password: "hashed_thread-password",
    username: "testuser",
    userId: null,
    ended: false,
    deleted: false,
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    top: false,
  };

  const mockResponse: ResponseData = {
    id: "response-1",
    threadId: 1,
    boardId: "test-board",
    seq: 0,
    username: "testuser",
    authorId: "author-123",
    userId: null,
    ip: "127.0.0.1",
    content: "Test content",
    attachment: null,
    visible: true,
    deleted: false,
    createdAt: new Date(),
  };

  const createMockResponseRepo = (): jest.Mocked<ResponseRepository> => ({
    findByThreadId: jest.fn(),
    findById: jest.fn(),
    findByThreadIdAndSeq: jest.fn(),
    findByThreadIdAndSeqRange: jest.fn(),
    findRecentByThreadId: jest.fn(),
    findByBoardIdCursor: jest.fn(),
    findByBoardIdChunked: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByThreadId: jest.fn(),
  });

  const createMockThreadRepo = (): jest.Mocked<ThreadRepository> => ({
    findByBoardId: jest.fn(),
    findByBoardIdWithResponseCount: jest.fn(),
    countByBoardId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateBumpTime: jest.fn(),
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

  const createMockBoardRepo = (): jest.Mocked<BoardRepository> => ({
    findAll: jest.fn(),
    findAllWithThreadCount: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateConfig: jest.fn(),
  });

  describe("findByThreadId", () => {
    it("should return responses for a valid thread", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockResponseRepo.findByThreadId.mockResolvedValue([mockResponse]);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      const result = await service.findByThreadId(1);

      expect(result).toEqual([mockResponse]);
      expect(mockThreadRepo.findById).toHaveBeenCalledWith(1);
      expect(mockResponseRepo.findByThreadId).toHaveBeenCalledWith(1, undefined);
    });

    it("should throw NOT_FOUND when thread does not exist", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(null);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.findByThreadId(999)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when thread is deleted", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue({ ...mockThread, deleted: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.findByThreadId(1)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when boardId does not match the thread's board", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(mockThread); // boardId: "test-board"

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(
        service.findByThreadId(1, undefined, "wrong-board")
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(mockResponseRepo.findByThreadId).not.toHaveBeenCalled();
    });

    it("should return responses when boardId matches the thread's board", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(mockThread); // boardId: "test-board"
      mockResponseRepo.findByThreadId.mockResolvedValue([mockResponse]);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      const result = await service.findByThreadId(1, undefined, "test-board");

      expect(result).toEqual([mockResponse]);
    });
  });

  describe("findByRange", () => {
    it("should return responses for a valid published thread", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockResponseRepo.findByThreadIdAndSeqRange.mockResolvedValue([mockResponse]);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      const result = await service.findByRange(1, { type: "range", startSeq: 1, endSeq: 5 });

      expect(result).toEqual([mockResponse]);
    });

    it("should throw NOT_FOUND when thread is not published", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue({ ...mockThread, published: false });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.findByRange(1, { type: "range", startSeq: 1, endSeq: 5 })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when boardId does not match", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(mockThread); // boardId: "test-board"

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      // Pass a different boardId
      await expect(service.findByRange(1, { type: "range", startSeq: 1, endSeq: 5 }, "wrong-board")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should pass when boardId matches", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(mockThread); // boardId: "test-board"
      mockResponseRepo.findByThreadIdAndSeqRange.mockResolvedValue([mockResponse]);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      // Pass matching boardId
      const result = await service.findByRange(1, { type: "range", startSeq: 1, endSeq: 5 }, "test-board");

      expect(result).toEqual([mockResponse]);
    });
  });

  describe("findById", () => {
    it("should return response when found", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      const result = await service.findById("response-1");

      expect(result).toEqual(mockResponse);
    });

    it("should throw NOT_FOUND when response does not exist", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(null);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.findById("non-existent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when response is deleted", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue({ ...mockResponse, deleted: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.findById("response-1")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when boardId does not match the response's board", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(mockResponse); // boardId: "test-board"

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(
        service.findById("response-1", "wrong-board")
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should return response when boardId matches the response's board", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(mockResponse); // boardId: "test-board"

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      const result = await service.findById("response-1", "test-board");

      expect(result).toEqual(mockResponse);
    });
  });

  describe("create", () => {
    const createInput = {
      threadId: 1,
      username: "newuser",
      authorId: "author-456",
      ip: "192.168.1.1",
      content: "New response",
    };

    it("should create response when thread exists", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();
      const mockBoardRepo = createMockBoardRepo();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockBoardRepo.findById.mockResolvedValue(mockBoard);
      mockResponseRepo.countByThreadId.mockResolvedValue(0);
      mockResponseRepo.create.mockResolvedValue({ ...mockResponse, ...createInput, seq: 1 });
      mockThreadRepo.updateBumpTime.mockResolvedValue(mockThread);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        boardRepository: mockBoardRepo,
        roleService: mockRoleService,
      });

      const result = await service.create(createInput);

      expect(result.content).toBe("New response");
      expect(mockResponseRepo.create).toHaveBeenCalledWith({
        ...createInput,
        boardId: mockThread.boardId,
      });
      expect(mockThreadRepo.updateBumpTime).toHaveBeenCalledWith(1);
    });

    it("should throw NOT_FOUND when thread does not exist", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue(null);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.create(createInput)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(mockResponseRepo.create).not.toHaveBeenCalled();
    });

    it("should throw BAD_REQUEST when thread is ended", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockThreadRepo.findById.mockResolvedValue({ ...mockThread, ended: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.create(createInput)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      expect(mockResponseRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const updateInput = { content: "Updated content" };

    it("should update response when user can manage the board", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockRoleService.canManageBoard.mockResolvedValue(true);
      mockResponseRepo.update.mockResolvedValue({ ...mockResponse, ...updateInput });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      const result = await service.update("user-1", "response-1", updateInput);

      expect(result.content).toBe("Updated content");
      expect(mockRoleService.canManageBoard).toHaveBeenCalledWith("user-1", mockThread.boardId);
    });

    it("should update response when user has a board admin role", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockRoleService.canManageBoard.mockResolvedValue(true);
      mockResponseRepo.update.mockResolvedValue({ ...mockResponse, ...updateInput });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      const result = await service.update("user-1", "response-1", updateInput);

      expect(result.content).toBe("Updated content");
      expect(mockRoleService.canManageBoard).toHaveBeenCalledWith("user-1", mockThread.boardId);
    });

    it("should throw FORBIDDEN when user has no permission", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockRoleService.canManageBoard.mockResolvedValue(false);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.update("user-1", "response-1", updateInput)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(mockResponseRepo.update).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when response does not exist", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(null);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.update("user-1", "non-existent", updateInput)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("delete", () => {
    // Response with seq > 0 for delete tests (seq 0 cannot be deleted)
    const deletableResponse = { ...mockResponse, seq: 1 };

    it("should delete response when user has a board admin role", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(deletableResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockRoleService.canManageBoard.mockResolvedValue(true);
      mockResponseRepo.delete.mockResolvedValue({ ...deletableResponse, deleted: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      const result = await service.delete("user-1", "response-1");

      expect(result.deleted).toBe(true);
      expect(mockRoleService.canManageBoard).toHaveBeenCalledWith("user-1", mockThread.boardId);
    });

    it("should delete response with correct thread password", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(deletableResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockRoleService.canManageBoard.mockResolvedValue(false);
      mockResponseRepo.delete.mockResolvedValue({ ...deletableResponse, deleted: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      const result = await service.delete(null, "response-1", "thread-password");

      expect(result.deleted).toBe(true);
    });

    it("should throw FORBIDDEN when user has no permission and wrong password", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(deletableResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockRoleService.canManageBoard.mockResolvedValue(false);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(
        service.delete(null, "response-1", "wrong-password")
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(mockResponseRepo.delete).not.toHaveBeenCalled();
    });

    it("should throw BAD_REQUEST when trying to delete seq 0 response", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(mockResponse); // seq: 0
      mockRoleService.canManageBoard.mockResolvedValue(true);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.delete("user-1", "response-1")).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("should throw NOT_FOUND when response does not exist", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockRoleService = createMockRoleService();

      mockResponseRepo.findById.mockResolvedValue(null);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: mockRoleService,
      });

      await expect(service.delete("user-1", "non-existent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("still allows password-based deletion without any role", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();

      mockResponseRepo.findById.mockResolvedValue(deletableResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockResponseRepo.delete.mockResolvedValue({ ...deletableResponse, deleted: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(
        service.delete("", "response-1", "thread-password")
      ).resolves.not.toThrow();
    });

    it("allows a board admin to delete without a password", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();

      mockResponseRepo.findById.mockResolvedValue(deletableResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockResponseRepo.delete.mockResolvedValue({ ...deletableResponse, deleted: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(true),
        }),
      });

      await expect(
        service.delete("u1", "response-1", undefined)
      ).resolves.not.toThrow();
    });
  });
});
