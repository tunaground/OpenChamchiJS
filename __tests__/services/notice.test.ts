import { createNoticeService } from "@/lib/services/notice";
import { RoleService } from "@/lib/services/role";
import { NoticeRepository, NoticeData } from "@/lib/repositories/interfaces/notice";
import { BoardRepository, BoardData } from "@/lib/repositories/interfaces/board";

function createMockNoticeRepo(): jest.Mocked<NoticeRepository> {
  return {
    findByBoardId: jest.fn(),
    findByBoardIdWithCount: jest.fn(),
    countByBoardId: jest.fn(),
    findGlobal: jest.fn(),
    findGlobalWithCount: jest.fn(),
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

function createMockRoleService(overrides: Partial<jest.Mocked<RoleService>> = {}): jest.Mocked<RoleService> {
  return {
    getUserRoles: jest.fn().mockResolvedValue([]),
    isAdmin: jest.fn().mockResolvedValue(false),
    isVerified: jest.fn().mockResolvedValue(false),
    canManageBoard: jest.fn().mockResolvedValue(false),
    listManagedBoardIds: jest.fn().mockResolvedValue([]),
    ...overrides,
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
  let roleService: jest.Mocked<RoleService>;
  let service: ReturnType<typeof createNoticeService>;

  const baseDeps = () => ({
    noticeRepository: noticeRepo,
    boardRepository: boardRepo,
    roleService,
  });

  beforeEach(() => {
    noticeRepo = createMockNoticeRepo();
    boardRepo = createMockBoardRepo();
    roleService = createMockRoleService();
    service = createNoticeService(baseDeps());
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
    it("creates notice when user can manage the board", async () => {
      const notice = createMockNotice();
      boardRepo.findById.mockResolvedValue(createMockBoard());
      roleService.canManageBoard.mockResolvedValue(true);
      noticeRepo.create.mockResolvedValue(notice);

      const result = await service.create("user-1", {
        boardId: "test-board",
        title: "New Notice",
        content: "Content",
      });

      expect(result).toEqual(notice);
      expect(noticeRepo.create).toHaveBeenCalled();
    });

    it("throws FORBIDDEN when user cannot manage the board", async () => {
      boardRepo.findById.mockResolvedValue(createMockBoard());
      roleService.canManageBoard.mockResolvedValue(false);

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

    it("checks board-management role with the target board id", async () => {
      boardRepo.findById.mockResolvedValue(createMockBoard());
      roleService.canManageBoard.mockResolvedValue(true);
      noticeRepo.create.mockResolvedValue(createMockNotice());

      await service.create("user-1", {
        boardId: "test-board",
        title: "New Notice",
        content: "Content",
      });

      expect(roleService.canManageBoard).toHaveBeenCalledWith("user-1", "test-board");
    });

    it("forbids a board admin from creating a global notice", async () => {
      const service = createNoticeService({
        ...baseDeps(),
        roleService: createMockRoleService({
          isAdmin: jest.fn().mockResolvedValue(false),
          canManageBoard: jest.fn().mockResolvedValue(true),
        }),
      });

      await expect(
        service.createGlobal("u1", { title: "공지", content: "내용" })
      ).rejects.toThrow("Permission denied");
    });

    it("lets a board admin create a notice on their board", async () => {
      const mockRoleService = createMockRoleService({
        isAdmin: jest.fn().mockResolvedValue(false),
        canManageBoard: jest.fn().mockResolvedValue(true),
      });
      boardRepo.findById.mockResolvedValue(createMockBoard({ id: "free" }));
      noticeRepo.create.mockResolvedValue(createMockNotice({ boardId: "free" }));
      const service = createNoticeService({ ...baseDeps(), roleService: mockRoleService });

      await service.create("u1", { boardId: "free", title: "공지", content: "내용" });

      expect(mockRoleService.canManageBoard).toHaveBeenCalledWith("u1", "free");
    });
  });

  describe("update", () => {
    it("updates notice when user can manage the board", async () => {
      const notice = createMockNotice();
      const updatedNotice = { ...notice, title: "Updated" };
      noticeRepo.findById.mockResolvedValue(notice);
      roleService.canManageBoard.mockResolvedValue(true);
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

    it("throws FORBIDDEN when user cannot manage the board", async () => {
      noticeRepo.findById.mockResolvedValue(createMockNotice());
      roleService.canManageBoard.mockResolvedValue(false);

      await expect(
        service.update("user-1", 1, { title: "Updated" })
      ).rejects.toThrow("Permission denied");
    });
  });

  describe("delete", () => {
    it("deletes notice when user can manage the board", async () => {
      const notice = createMockNotice();
      noticeRepo.findById.mockResolvedValue(notice);
      roleService.canManageBoard.mockResolvedValue(true);
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

    it("throws FORBIDDEN when user cannot manage the board", async () => {
      noticeRepo.findById.mockResolvedValue(createMockNotice());
      roleService.canManageBoard.mockResolvedValue(false);

      await expect(service.delete("user-1", 1)).rejects.toThrow(
        "Permission denied"
      );
    });
  });

  describe("findPinnedAndRecent (global notices)", () => {
    it("includes global notices in results", async () => {
      const notices = [
        createMockNotice({ id: 1, pinned: true, boardId: null }),
        createMockNotice({ id: 2, pinned: false, boardId: "test-board" }),
      ];
      boardRepo.findById.mockResolvedValue(createMockBoard());
      noticeRepo.findByBoardId.mockResolvedValue(notices);

      const result = await service.findPinnedAndRecent("test-board", 3);

      expect(result).toHaveLength(2);
      expect(noticeRepo.findByBoardId).toHaveBeenCalledWith(
        "test-board",
        expect.objectContaining({ includeGlobal: true })
      );
    });
  });

  describe("findGlobal", () => {
    it("returns paginated global notices", async () => {
      const notices = [
        createMockNotice({ id: 1, boardId: null }),
        createMockNotice({ id: 2, boardId: null }),
      ];
      noticeRepo.findGlobalWithCount.mockResolvedValue({ data: notices, total: 2 });

      const result = await service.findGlobal();

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it("does not authorize global notice reads", async () => {
      const mockRoleService = createMockRoleService();
      noticeRepo.findGlobalWithCount.mockResolvedValue({ data: [], total: 0 });
      const service = createNoticeService({ ...baseDeps(), roleService: mockRoleService });

      await service.findGlobal({ page: 1 });

      expect(mockRoleService.isAdmin).not.toHaveBeenCalled();
      expect(mockRoleService.getUserRoles).not.toHaveBeenCalled();
    });
  });

  describe("createGlobal", () => {
    it("creates global notice with boardId null", async () => {
      const notice = createMockNotice({ boardId: null });
      roleService.isAdmin.mockResolvedValue(true);
      noticeRepo.create.mockResolvedValue(notice);

      const result = await service.createGlobal("user-1", {
        title: "Global Notice",
        content: "Content",
      });

      expect(result.boardId).toBeNull();
      expect(noticeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ boardId: null })
      );
    });

    it("checks the admin role, not board management", async () => {
      roleService.isAdmin.mockResolvedValue(true);
      noticeRepo.create.mockResolvedValue(createMockNotice({ boardId: null }));

      await service.createGlobal("user-1", {
        title: "Global Notice",
        content: "Content",
      });

      expect(roleService.isAdmin).toHaveBeenCalledWith("user-1");
      expect(roleService.canManageBoard).not.toHaveBeenCalled();
    });

    it("throws FORBIDDEN when user is not admin", async () => {
      roleService.isAdmin.mockResolvedValue(false);

      await expect(
        service.createGlobal("user-1", {
          title: "Global Notice",
          content: "Content",
        })
      ).rejects.toThrow("Permission denied");
    });
  });

  describe("update (global notice)", () => {
    it("checks the admin role for global notices", async () => {
      const notice = createMockNotice({ boardId: null });
      noticeRepo.findById.mockResolvedValue(notice);
      roleService.isAdmin.mockResolvedValue(true);
      noticeRepo.update.mockResolvedValue({ ...notice, title: "Updated" });

      await service.update("user-1", 1, { title: "Updated" });

      expect(roleService.isAdmin).toHaveBeenCalledWith("user-1");
      expect(roleService.canManageBoard).not.toHaveBeenCalled();
    });
  });

  describe("delete (global notice)", () => {
    it("checks the admin role for global notices", async () => {
      const notice = createMockNotice({ boardId: null });
      noticeRepo.findById.mockResolvedValue(notice);
      roleService.isAdmin.mockResolvedValue(true);
      noticeRepo.delete.mockResolvedValue({ ...notice, deleted: true });

      await service.delete("user-1", 1);

      expect(roleService.isAdmin).toHaveBeenCalledWith("user-1");
      expect(roleService.canManageBoard).not.toHaveBeenCalled();
    });
  });
});
