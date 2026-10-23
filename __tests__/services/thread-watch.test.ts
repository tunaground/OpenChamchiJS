import { createThreadWatchService } from "@/lib/services/thread-watch";
import { ThreadWatchRepository } from "@/lib/repositories/interfaces/thread-watch";
import { ThreadRepository, ThreadData } from "@/lib/repositories/interfaces/thread";
import { GlobalSettingsService } from "@/lib/services/global-settings";
import { GlobalSettingsData } from "@/lib/repositories/interfaces/global-settings";

describe("ThreadWatchService", () => {
  const enabledSettings = {
    pushWatchLimit: 10,
    vapidPublicKey: "pub",
    vapidPrivateKey: "priv",
    vapidSubject: "mailto:a@b.c",
  } as GlobalSettingsData;

  const createMockThreadWatchRepository = (): jest.Mocked<ThreadWatchRepository> => ({
    findActiveByUser: jest.fn().mockResolvedValue([]),
    findByUserAndThread: jest.fn().mockResolvedValue(null),
    countByUser: jest.fn().mockResolvedValue(0),
    createWithinLimit: jest.fn().mockResolvedValue("created"),
    findById: jest.fn().mockResolvedValue(null),
    setEnabled: jest.fn(),
    delete: jest.fn(),
    deleteByUserAndThread: jest.fn(),
    setViewing: jest.fn(),
    getUserPushEnabled: jest.fn().mockResolvedValue(true),
    setUserPushEnabled: jest.fn(),
    claimRecipients: jest.fn().mockResolvedValue([]),
  });

  const createMockThreadRepository = (): jest.Mocked<ThreadRepository> => ({
    findByBoardId: jest.fn(),
    findByBoardIdWithResponseCount: jest.fn(),
    findByBoardIdWithCount: jest.fn(),
    countByBoardId: jest.fn(),
    findById: jest.fn().mockResolvedValue({ id: 1, boardId: "free", deleted: false } as ThreadData),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateBumpTime: jest.fn(),
  });

  const createMockSettingsService = (
    settings: Partial<GlobalSettingsData> = {}
  ): jest.Mocked<GlobalSettingsService> => ({
    get: jest.fn().mockResolvedValue({ ...enabledSettings, ...settings }),
    update: jest.fn(),
    getCountryCode: jest.fn(),
  });

  function setup(settings: Partial<GlobalSettingsData> = {}) {
    const threadWatchRepository = createMockThreadWatchRepository();
    const threadRepository = createMockThreadRepository();
    const globalSettingsService = createMockSettingsService(settings);
    const service = createThreadWatchService({
      threadWatchRepository,
      threadRepository,
      globalSettingsService,
    });
    return { service, threadWatchRepository, threadRepository };
  }

  describe("watch", () => {
    it("rejects when feature disabled (limit 0)", async () => {
      const { service, threadWatchRepository } = setup({ pushWatchLimit: 0 });
      await expect(service.watch("u1", 1)).rejects.toMatchObject({ code: "FEATURE_DISABLED" });
      expect(threadWatchRepository.createWithinLimit).not.toHaveBeenCalled();
    });

    it("rejects a deleted thread", async () => {
      const { service, threadRepository, threadWatchRepository } = setup();
      threadRepository.findById.mockResolvedValue({ id: 1, deleted: true } as ThreadData);
      await expect(service.watch("u1", 1)).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(threadWatchRepository.createWithinLimit).not.toHaveBeenCalled();
    });

    it("rejects a missing thread", async () => {
      const { service, threadRepository } = setup();
      threadRepository.findById.mockResolvedValue(null);
      await expect(service.watch("u1", 1)).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("passes settings limit to repository", async () => {
      const { service, threadWatchRepository } = setup();
      await service.watch("u1", 1);
      expect(threadWatchRepository.createWithinLimit).toHaveBeenCalledWith("u1", 1, 10);
    });

    it("throws WATCH_LIMIT_EXCEEDED when repository returns limit", async () => {
      const { service, threadWatchRepository } = setup();
      threadWatchRepository.createWithinLimit.mockResolvedValue("limit");
      await expect(service.watch("u1", 1)).rejects.toMatchObject({ code: "WATCH_LIMIT_EXCEEDED" });
    });

    it("is idempotent when repository returns exists", async () => {
      const { service, threadWatchRepository } = setup();
      threadWatchRepository.createWithinLimit.mockResolvedValue("exists");
      await expect(service.watch("u1", 1)).resolves.toBeUndefined();
    });
  });

  describe("remove", () => {
    it("rejects another user's watch", async () => {
      const { service, threadWatchRepository } = setup();
      threadWatchRepository.findById.mockResolvedValue({ id: "w1", userId: "other" });
      await expect(service.remove("u1", "w1")).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(threadWatchRepository.delete).not.toHaveBeenCalled();
    });

    it("deletes the caller's own watch", async () => {
      const { service, threadWatchRepository } = setup();
      threadWatchRepository.findById.mockResolvedValue({ id: "w1", userId: "u1" });
      await service.remove("u1", "w1");
      expect(threadWatchRepository.delete).toHaveBeenCalledWith("w1");
    });
  });

  describe("unwatchThread", () => {
    it("deletes by user and thread", async () => {
      const { service, threadWatchRepository } = setup();
      await service.unwatchThread("u1", 7);
      expect(threadWatchRepository.deleteByUserAndThread).toHaveBeenCalledWith("u1", 7);
    });
  });

  describe("setEnabled", () => {
    it("updates only that watch", async () => {
      const { service, threadWatchRepository } = setup();
      threadWatchRepository.findById.mockResolvedValue({ id: "w1", userId: "u1" });
      await service.setEnabled("u1", "w1", false);
      expect(threadWatchRepository.setEnabled).toHaveBeenCalledWith("w1", false);
      expect(threadWatchRepository.setUserPushEnabled).not.toHaveBeenCalled();
    });

    it("rejects another user's watch", async () => {
      const { service, threadWatchRepository } = setup();
      threadWatchRepository.findById.mockResolvedValue({ id: "w1", userId: "other" });
      await expect(service.setEnabled("u1", "w1", false)).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(threadWatchRepository.setEnabled).not.toHaveBeenCalled();
    });
  });

  describe("setPushEnabled", () => {
    it("does not touch per-watch enabled", async () => {
      const { service, threadWatchRepository } = setup();
      await service.setPushEnabled("u1", false);
      expect(threadWatchRepository.setUserPushEnabled).toHaveBeenCalledWith("u1", false);
      expect(threadWatchRepository.setEnabled).not.toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("returns items, limit and pushEnabled even when count exceeds limit", async () => {
      const { service, threadWatchRepository } = setup({ pushWatchLimit: 2 });
      const items = [1, 2, 3].map((n) => ({
        id: `w${n}`, threadId: n, boardId: "free", title: `t${n}`, threadDeleted: false, enabled: true,
      }));
      threadWatchRepository.findActiveByUser.mockResolvedValue(items);
      threadWatchRepository.getUserPushEnabled.mockResolvedValue(false);
      await expect(service.list("u1")).resolves.toEqual({ items, limit: 2, pushEnabled: false });
    });

    it("rejects when feature disabled", async () => {
      const { service } = setup({ vapidPrivateKey: null });
      await expect(service.list("u1")).rejects.toMatchObject({ code: "FEATURE_DISABLED" });
    });
  });

  describe("reportViewing", () => {
    it("sets now when viewing", async () => {
      const { service, threadWatchRepository } = setup();
      await service.reportViewing("u1", 1, true);
      expect(threadWatchRepository.setViewing).toHaveBeenCalledWith("u1", 1, expect.any(Date));
    });

    it("sets null when not viewing", async () => {
      const { service, threadWatchRepository } = setup();
      await service.reportViewing("u1", 1, false);
      expect(threadWatchRepository.setViewing).toHaveBeenCalledWith("u1", 1, null);
    });

    it("is a silent no-op when feature disabled", async () => {
      const { service, threadWatchRepository } = setup({ pushWatchLimit: 0 });
      await expect(service.reportViewing("u1", 1, true)).resolves.toBeUndefined();
      expect(threadWatchRepository.setViewing).not.toHaveBeenCalled();
    });
  });
});
