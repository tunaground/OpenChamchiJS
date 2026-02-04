import { createNoticeService } from "@/lib/services/notice";
import { PermissionService } from "@/lib/services/permission";
import { NoticeRepository, NoticeData } from "@/lib/repositories/interfaces/notice";
import { BoardRepository, BoardData } from "@/lib/repositories/interfaces/board";

function createMockNoticeRepo(): jest.Mocked<NoticeRepository> {
  return {
    findByBoardId: jest.fn(),
    findByBoardIdWithCount: jest.fn(),
    countByBoardId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function createMockBoardRepo(): jest.Mocked<BoardRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function createMockPermissionService(): jest.Mocked<PermissionService> {
  return {
    getUserPermissions: jest.fn(),
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    checkUserPermission: jest.fn(),
    checkUserPermissions: jest.fn(),
  };
}

function createMockNotice(overrides?: Partial<NoticeData>): NoticeData {
  return {
    id: 1,
    boardId: "test-board",
    title: "Test Notice",
    content: "Test content",
    pinned: false,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockBoard(overrides?: Partial<BoardData>): BoardData {
  return {
    id: "test-board",
    name: "Test Board",
    defaultUsername: "noname",
    deleted: false,
    maxResponsesPerThread: 1000,
    blockForeignIp: false,
    responsesPerPage: 50,
    showUserCount: false,
    threadsPerPage: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("NoticeService", () => {
  let noticeRepo: jest.Mocked<NoticeRepository>;
  let boardRepo: jest.Mocked<BoardRepository>;
  let permissionService: jest.Mocked<PermissionService>;
  let service: ReturnType<typeof createNoticeService>;

  beforeEach(() => {
    noticeRepo = createMockNoticeRepo();
    boardRepo = createMockBoardRepo();
    permissionService = createMockPermissionService();
    service = createNoticeService({
      noticeRepository: noticeRepo,
      boardRepository: boardRepo,
      permissionService,
    });
  });

  describe("findByBoardId", () => {
    it("returns paginated notices for existing board", async () => {
      const notices = [createMockNotice(), createMockNotice({ id: 2 })];
      boardRepo.findById.mockResolvedValue(createMockBoard());
      noticeRepo.findByBoardIdWithCount.mockResolvedValue({ data: notices, total: 2 });

      const result = await service.findByBoardId("test-board");

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it("throws NOT_FOUND when board does not exist", async () => {
      boardRepo.findById.mockResolvedValue(null);

      await expect(service.findByBoardId("nonexistent")).rejects.toThrow(
        "Board not found"
      );
    });

    it("throws NOT_FOUND when board is deleted", async () => {
      boardRepo.findById.mockResolvedValue(createMockBoard({ deleted: true }));

      await expect(service.findByBoardId("test-board")).rejects.toThrow(
        "Board not found"
      );
    });

    it("passes pagination options to repository", async () => {
      boardRepo.findById.mockResolvedValue(createMockBoard());
      noticeRepo.findByBoardIdWithCount.mockResolvedValue({ data: [], total: 0 });

      await service.findByBoardId("test-board", { page: 2, limit: 10, search: "test" });

      expect(noticeRepo.findByBoardIdWithCount).toHaveBeenCalledWith(
        "test-board",
        expect.objectContaining({ page: 2, limit: 10, search: "test" })
      );
    });
  });

  describe("findPinnedAndRecent", () => {
    it("returns all pinned notices plus recent non-pinned", async () => {
      const notices = [
        createMockNotice({ id: 1, pinned: true }),
        createMockNotice({ id: 2, pinned: true }),
        createMockNotice({ id: 3, pinned: false }),
        createMockNotice({ id: 4, pinned: false }),
        createMockNotice({ id: 5, pinned: false }),
        createMockNotice({ id: 6, pinned: false }),
      ];
      boardRepo.findById.mockResolvedValue(createMockBoard());
      noticeRepo.findByBoardId.mockResolvedValue(notices);

      const result = await service.findPinnedAndRecent("test-board", 3);

      // 2 pinned + 3 recent non-pinned
      expect(result).toHaveLength(5);
      expect(result.filter((n) => n.pinned)).toHaveLength(2);
      expect(result.filter((n) => !n.pinned)).toHaveLength(3);
    });

    it("throws NOT_FOUND when board does not exist", async () => {
      boardRepo.findById.mockResolvedValue(null);

      await expect(service.findPinnedAndRecent("nonexistent")).rejects.toThrow(
        "Board not found"
      );
    });

    it("uses default recentCount of 3", async () => {
      const notices = [
        createMockNotice({ id: 1, pinned: false }),
        createMockNotice({ id: 2, pinned: false }),
        createMockNotice({ id: 3, pinned: false }),
        createMockNotice({ id: 4, pinned: false }),
      ];
      boardRepo.findById.mockResolvedValue(createMockBoard());
      noticeRepo.findByBoardId.mockResolvedValue(notices);

      const result = await service.findPinnedAndRecent("test-board");

      expect(result).toHaveLength(3);
    });
  });

  describe("findById", () => {
    it("returns notice by id", async () => {
      const notice = createMockNotice();
      noticeRepo.findById.mockResolvedValue(notice);

      const result = await service.findById(1);

      expect(result).toEqual(notice);
    });

    it("throws NOT_FOUND when notice does not exist", async () => {
      noticeRepo.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow("Notice not found");
    });

    it("throws NOT_FOUND when notice is deleted", async () => {
      noticeRepo.findById.mockResolvedValue(createMockNotice({ deleted: true }));

      await expect(service.findById(1)).rejects.toThrow("Notice not found");
    });
  });

  describe("create", () => {
    it("creates notice when user has permission", async () => {
      const notice = createMockNotice();
      boardRepo.findById.mockResolvedValue(createMockBoard());
      permissionService.checkUserPermissions.mockResolvedValue(true);
      noticeRepo.create.mockResolvedValue(notice);

      const result = await service.create("user-1", {
        boardId: "test-board",
        title: "New Notice",
        content: "Content",
      });

      expect(result).toEqual(notice);
      expect(noticeRepo.create).toHaveBeenCalled();
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      boardRepo.findById.mockResolvedValue(createMockBoard());
      permissionService.checkUserPermissions.mockResolvedValue(false);

      await expect(
        service.create("user-1", {
          boardId: "test-board",
          title: "New Notice",
          content: "Content",
        })
      ).rejects.toThrow("Permission denied");
    });

    it("throws NOT_FOUND when board does not exist", async () => {
      boardRepo.findById.mockResolvedValue(null);

      await expect(
        service.create("user-1", {
          boardId: "nonexistent",
          title: "New Notice",
          content: "Content",
        })
      ).rejects.toThrow("Board not found");
    });

    it("checks both global and board-specific permissions", async () => {
      boardRepo.findById.mockResolvedValue(createMockBoard());
      permissionService.checkUserPermissions.mockResolvedValue(true);
      noticeRepo.create.mockResolvedValue(createMockNotice());

      await service.create("user-1", {
        boardId: "test-board",
        title: "New Notice",
        content: "Content",
      });

      expect(permissionService.checkUserPermissions).toHaveBeenCalledWith(
        "user-1",
        ["notice:create", "notice:test-board:create"]
      );
    });
  });

  describe("update", () => {
    it("updates notice when user has permission", async () => {
      const notice = createMockNotice();
      const updatedNotice = { ...notice, title: "Updated" };
      noticeRepo.findById.mockResolvedValue(notice);
      permissionService.checkUserPermissions.mockResolvedValue(true);
      noticeRepo.update.mockResolvedValue(updatedNotice);

      const result = await service.update("user-1", 1, { title: "Updated" });

      expect(result.title).toBe("Updated");
    });

    it("throws NOT_FOUND when notice does not exist", async () => {
      noticeRepo.findById.mockResolvedValue(null);

      await expect(
        service.update("user-1", 999, { title: "Updated" })
      ).rejects.toThrow("Notice not found");
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      noticeRepo.findById.mockResolvedValue(createMockNotice());
      permissionService.checkUserPermissions.mockResolvedValue(false);

      await expect(
        service.update("user-1", 1, { title: "Updated" })
      ).rejects.toThrow("Permission denied");
    });
  });

  describe("delete", () => {
    it("deletes notice when user has permission", async () => {
      const notice = createMockNotice();
      noticeRepo.findById.mockResolvedValue(notice);
      permissionService.checkUserPermissions.mockResolvedValue(true);
      noticeRepo.delete.mockResolvedValue({ ...notice, deleted: true });

      const result = await service.delete("user-1", 1);

      expect(result.deleted).toBe(true);
    });

    it("throws NOT_FOUND when notice does not exist", async () => {
      noticeRepo.findById.mockResolvedValue(null);

      await expect(service.delete("user-1", 999)).rejects.toThrow(
        "Notice not found"
      );
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      noticeRepo.findById.mockResolvedValue(createMockNotice());
      permissionService.checkUserPermissions.mockResolvedValue(false);

      await expect(service.delete("user-1", 1)).rejects.toThrow(
        "Permission denied"
      );
    });
  });
});
