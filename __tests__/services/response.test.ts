import bcrypt from "bcryptjs";
import { createResponseService, ResponseServiceError } from "@/lib/services/response";
import { PermissionService } from "@/lib/services/permission";
import { ResponseRepository, ResponseData } from "@/lib/repositories/interfaces/response";
import { ThreadRepository, ThreadData } from "@/lib/repositories/interfaces/thread";

jest.mock("bcryptjs");

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("ResponseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBcrypt.compare.mockImplementation((password: string, hash: string) =>
      Promise.resolve(hash === `hashed_${password}`)
    );
  });

  const mockThread: ThreadData = {
    id: 1,
    boardId: "test-board",
    title: "Test Thread",
    password: "hashed_thread-password",
    username: "testuser",
    ended: false,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    top: false,
  };

  const mockResponse: ResponseData = {
    id: "response-1",
    threadId: 1,
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
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByThreadId: jest.fn(),
  });

  const createMockThreadRepo = (): jest.Mocked<ThreadRepository> => ({
    findByBoardId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateBumpTime: jest.fn(),
  });

  const createMockPermission = (): jest.Mocked<PermissionService> => ({
    getUserPermissions: jest.fn(),
    hasPermission: jest.fn(),
    checkUserPermission: jest.fn(),
  });

  describe("findByThreadId", () => {
    it("should return responses for a valid thread", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockResponseRepo.findByThreadId.mockResolvedValue([mockResponse]);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      const result = await service.findByThreadId(1);

      expect(result).toEqual([mockResponse]);
      expect(mockThreadRepo.findById).toHaveBeenCalledWith(1);
      expect(mockResponseRepo.findByThreadId).toHaveBeenCalledWith(1, undefined);
    });

    it("should throw NOT_FOUND when thread does not exist", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(null);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      await expect(service.findByThreadId(999)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when thread is deleted", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue({ ...mockThread, deleted: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      await expect(service.findByThreadId(1)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("findById", () => {
    it("should return response when found", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      const result = await service.findById("response-1");

      expect(result).toEqual(mockResponse);
    });

    it("should throw NOT_FOUND when response does not exist", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue(null);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      await expect(service.findById("non-existent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("should throw NOT_FOUND when response is deleted", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue({ ...mockResponse, deleted: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      await expect(service.findById("response-1")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
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
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockResponseRepo.create.mockResolvedValue({ ...mockResponse, ...createInput, seq: 1 });
      mockThreadRepo.updateBumpTime.mockResolvedValue(mockThread);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      const result = await service.create(createInput);

      expect(result.content).toBe("New response");
      expect(mockResponseRepo.create).toHaveBeenCalledWith(createInput);
      expect(mockThreadRepo.updateBumpTime).toHaveBeenCalledWith(1);
    });

    it("should throw NOT_FOUND when thread does not exist", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue(null);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      await expect(service.create(createInput)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(mockResponseRepo.create).not.toHaveBeenCalled();
    });

    it("should throw BAD_REQUEST when thread is ended", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockThreadRepo.findById.mockResolvedValue({ ...mockThread, ended: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      await expect(service.create(createInput)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      expect(mockResponseRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const updateInput = { content: "Updated content" };

    it("should update response when user has thread:edit permission", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermission.mockImplementation(
        async (_, permission) => permission === "thread:edit"
      );
      mockResponseRepo.update.mockResolvedValue({ ...mockResponse, ...updateInput });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      const result = await service.update("user-1", "response-1", updateInput);

      expect(result.content).toBe("Updated content");
    });

    it("should update response when user has board-specific permission", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermission.mockImplementation(
        async (_, permission) => permission === "thread:test-board:edit"
      );
      mockResponseRepo.update.mockResolvedValue({ ...mockResponse, ...updateInput });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      const result = await service.update("user-1", "response-1", updateInput);

      expect(result.content).toBe("Updated content");
    });

    it("should throw FORBIDDEN when user has no permission", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermission.mockResolvedValue(false);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      await expect(service.update("user-1", "response-1", updateInput)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(mockResponseRepo.update).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when response does not exist", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue(null);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      await expect(service.update("user-1", "non-existent", updateInput)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("delete", () => {
    it("should delete response when user has thread:delete permission", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermission.mockImplementation(
        async (_, permission) => permission === "thread:delete"
      );
      mockResponseRepo.delete.mockResolvedValue({ ...mockResponse, deleted: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      const result = await service.delete("user-1", "response-1");

      expect(result.deleted).toBe(true);
    });

    it("should delete response with correct thread password", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermission.mockResolvedValue(false);
      mockResponseRepo.delete.mockResolvedValue({ ...mockResponse, deleted: true });

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      const result = await service.delete(null, "response-1", "thread-password");

      expect(result.deleted).toBe(true);
    });

    it("should throw FORBIDDEN when user has no permission and wrong password", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue(mockResponse);
      mockThreadRepo.findById.mockResolvedValue(mockThread);
      mockPermission.checkUserPermission.mockResolvedValue(false);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      await expect(
        service.delete(null, "response-1", "wrong-password")
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(mockResponseRepo.delete).not.toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when response does not exist", async () => {
      const mockResponseRepo = createMockResponseRepo();
      const mockThreadRepo = createMockThreadRepo();
      const mockPermission = createMockPermission();

      mockResponseRepo.findById.mockResolvedValue(null);

      const service = createResponseService({
        responseRepository: mockResponseRepo,
        threadRepository: mockThreadRepo,
        permissionService: mockPermission,
      });

      await expect(service.delete("user-1", "non-existent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });
});
