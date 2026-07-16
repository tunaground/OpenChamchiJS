import { createThreadBanService } from "@/lib/services/thread-ban";
import { RoleService } from "@/lib/services/role";
import {
  ThreadBanRepository,
  ThreadBanData,
} from "@/lib/repositories/interfaces/thread-ban";
import { ThreadRepository, ThreadData } from "@/lib/repositories/interfaces/thread";

describe("ThreadBanService", () => {
  const mockBan: ThreadBanData = {
    id: "ban-1",
    threadId: 1,
    authorId: "author-1",
    createdAt: new Date(),
  };

  const mockThread: ThreadData = {
    id: 1,
    boardId: "free",
    title: "Test Thread",
    password: "hashed",
    username: "testuser",
    userId: null,
    ended: false,
    deleted: false,
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    top: false,
    responseCount: 0,
  };

  const createMockThreadBanRepository = (): jest.Mocked<ThreadBanRepository> => ({
    findByThreadId: jest.fn(),
    findById: jest.fn(),
    isBanned: jest.fn(),
    createMany: jest.fn(),
    delete: jest.fn(),
  });

  const createMockThreadRepository = (): jest.Mocked<ThreadRepository> => ({
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

  const baseDeps = {
    threadBanRepository: createMockThreadBanRepository(),
    threadRepository: createMockThreadRepository(),
    roleService: createMockRoleService(),
  };

  describe("findByThreadId", () => {
    it("lets a board admin ban on their board", async () => {
      const roleService = createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(true),
      });
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue({ id: 1, boardId: "free" } as ThreadData);
      const service = createThreadBanService({
        ...baseDeps,
        threadRepository,
        roleService,
      });

      await service.findByThreadId("u1", 1);

      expect(roleService.canManageBoard).toHaveBeenCalledWith("u1", "free");
    });

    it("forbids a user who does not manage the board", async () => {
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue({ id: 1, boardId: "free" } as ThreadData);
      const service = createThreadBanService({
        ...baseDeps,
        threadRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(service.findByThreadId("u1", 1)).rejects.toThrow(
        "Permission denied"
      );
    });

    it("returns bans when the user can manage the thread's board", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.findByThreadId.mockResolvedValue([mockBan]);
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(mockThread);
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
        threadRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(true),
        }),
      });

      const result = await service.findByThreadId("u1", 1);

      expect(result).toEqual([mockBan]);
      expect(threadBanRepository.findByThreadId).toHaveBeenCalledWith(1);
    });

    it("throws NOT_FOUND when thread does not exist", async () => {
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(null);
      const service = createThreadBanService({
        ...baseDeps,
        threadRepository,
      });

      await expect(service.findByThreadId("u1", 999)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("does not check permission on a different board's admin role", async () => {
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue({ id: 1, boardId: "free" } as ThreadData);
      const roleService = createMockRoleService({
        canManageBoard: jest.fn().mockImplementation(
          async (_userId: string, boardId: string) => boardId === "other-board"
        ),
      });
      const service = createThreadBanService({
        ...baseDeps,
        threadRepository,
        roleService,
      });

      await expect(service.findByThreadId("u1", 1)).rejects.toThrow(
        "Permission denied"
      );
      expect(roleService.canManageBoard).toHaveBeenCalledWith("u1", "free");
    });
  });

  describe("findByThreadIdDirect", () => {
    it("returns bans without checking permission", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.findByThreadId.mockResolvedValue([mockBan]);
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(mockThread);
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
        threadRepository,
      });

      const result = await service.findByThreadIdDirect(1);

      expect(result).toEqual([mockBan]);
    });

    it("throws NOT_FOUND when thread does not exist", async () => {
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(null);
      const service = createThreadBanService({
        ...baseDeps,
        threadRepository,
      });

      await expect(service.findByThreadIdDirect(999)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("isBanned", () => {
    it("delegates to the repository", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.isBanned.mockResolvedValue(true);
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
      });

      const result = await service.isBanned(1, "author-1");

      expect(result).toBe(true);
      expect(threadBanRepository.isBanned).toHaveBeenCalledWith(1, "author-1");
    });
  });

  describe("createBans", () => {
    it("creates bans when the admin user can manage the board", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.createMany.mockResolvedValue([mockBan]);
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(mockThread);
      const roleService = createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(true),
      });
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
        threadRepository,
        roleService,
      });

      const result = await service.createBans("admin-1", 1, ["author-1"]);

      expect(result).toEqual([mockBan]);
      expect(roleService.canManageBoard).toHaveBeenCalledWith("admin-1", "free");
      expect(threadBanRepository.createMany).toHaveBeenCalledWith([
        { threadId: 1, authorId: "author-1" },
      ]);
    });

    it("dedupes authorIds before creating", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.createMany.mockResolvedValue([mockBan]);
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(mockThread);
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
        threadRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(true),
        }),
      });

      await service.createBans("admin-1", 1, ["author-1", "author-1"]);

      expect(threadBanRepository.createMany).toHaveBeenCalledWith([
        { threadId: 1, authorId: "author-1" },
      ]);
    });

    it("throws BAD_REQUEST when authorIds is empty", async () => {
      const service = createThreadBanService(baseDeps);

      await expect(service.createBans("admin-1", 1, [])).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("throws NOT_FOUND when thread does not exist", async () => {
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(null);
      const service = createThreadBanService({
        ...baseDeps,
        threadRepository,
      });

      await expect(
        service.createBans("admin-1", 999, ["author-1"])
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws FORBIDDEN when the admin user cannot manage the board", async () => {
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(mockThread);
      const service = createThreadBanService({
        ...baseDeps,
        threadRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(
        service.createBans("admin-1", 1, ["author-1"])
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("createBansDirect", () => {
    it("creates bans without checking permission", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.createMany.mockResolvedValue([mockBan]);
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(mockThread);
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
        threadRepository,
      });

      const result = await service.createBansDirect(1, ["author-1"]);

      expect(result).toEqual([mockBan]);
    });

    it("throws BAD_REQUEST when authorIds is empty", async () => {
      const service = createThreadBanService(baseDeps);

      await expect(service.createBansDirect(1, [])).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("throws NOT_FOUND when thread does not exist", async () => {
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(null);
      const service = createThreadBanService({
        ...baseDeps,
        threadRepository,
      });

      await expect(
        service.createBansDirect(999, ["author-1"])
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("deleteBan", () => {
    it("deletes the ban when the admin user can manage the board", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.findById.mockResolvedValue(mockBan);
      threadBanRepository.delete.mockResolvedValue(mockBan);
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(mockThread);
      const roleService = createMockRoleService({
        canManageBoard: jest.fn().mockResolvedValue(true),
      });
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
        threadRepository,
        roleService,
      });

      const result = await service.deleteBan("admin-1", "ban-1");

      expect(result).toEqual(mockBan);
      expect(roleService.canManageBoard).toHaveBeenCalledWith("admin-1", "free");
      expect(threadBanRepository.delete).toHaveBeenCalledWith("ban-1");
    });

    it("throws NOT_FOUND when the ban does not exist", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.findById.mockResolvedValue(null);
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
      });

      await expect(
        service.deleteBan("admin-1", "missing-ban")
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws FORBIDDEN when the admin user cannot manage the board", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.findById.mockResolvedValue(mockBan);
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(mockThread);
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
        threadRepository,
        roleService: createMockRoleService({
          canManageBoard: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(
        service.deleteBan("admin-1", "ban-1")
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(threadBanRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("deleteBanDirect", () => {
    it("deletes the ban without checking permission", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.findById.mockResolvedValue(mockBan);
      threadBanRepository.delete.mockResolvedValue(mockBan);
      const threadRepository = createMockThreadRepository();
      threadRepository.findById.mockResolvedValue(mockThread);
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
        threadRepository,
      });

      const result = await service.deleteBanDirect("ban-1");

      expect(result).toEqual(mockBan);
    });

    it("throws NOT_FOUND when the ban does not exist", async () => {
      const threadBanRepository = createMockThreadBanRepository();
      threadBanRepository.findById.mockResolvedValue(null);
      const service = createThreadBanService({
        ...baseDeps,
        threadBanRepository,
      });

      await expect(
        service.deleteBanDirect("missing-ban")
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
