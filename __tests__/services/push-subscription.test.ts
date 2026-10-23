import { createPushSubscriptionService } from "@/lib/services/push-subscription";
import {
  PushSubscriptionRepository,
  UpsertPushSubscriptionInput,
} from "@/lib/repositories/interfaces/push-subscription";
import { GlobalSettingsService } from "@/lib/services/global-settings";
import { GlobalSettingsData } from "@/lib/repositories/interfaces/global-settings";

describe("PushSubscriptionService", () => {
  const enabledSettings = {
    pushWatchLimit: 10,
    vapidPublicKey: "pub",
    vapidPrivateKey: "priv",
    vapidSubject: "mailto:a@b.c",
  } as GlobalSettingsData;

  const input: UpsertPushSubscriptionInput = {
    userId: "userB",
    endpoint: "e1",
    p256dh: "p",
    auth: "a",
    locale: "ko",
    userAgent: null,
  };

  function setup(settings: Partial<GlobalSettingsData> = {}) {
    const pushSubscriptionRepository: jest.Mocked<PushSubscriptionRepository> = {
      upsertByEndpoint: jest.fn(),
      findByUserIds: jest.fn(),
      deleteByEndpoint: jest.fn(),
      deleteByIds: jest.fn(),
      deleteAll: jest.fn(),
      touch: jest.fn(),
    };
    const globalSettingsService: jest.Mocked<GlobalSettingsService> = {
      get: jest.fn().mockResolvedValue({ ...enabledSettings, ...settings }),
      update: jest.fn(),
      getCountryCode: jest.fn(),
    };
    const generateVapidKeys = jest.fn().mockReturnValue({ publicKey: "P", privateKey: "S" });
    const service = createPushSubscriptionService({
      pushSubscriptionRepository,
      globalSettingsService,
      generateVapidKeys,
    });
    return { service, pushSubscriptionRepository, globalSettingsService };
  }

  it("subscribe passes the caller's userId so a shared endpoint changes owner", async () => {
    const { service, pushSubscriptionRepository } = setup();
    await service.subscribe(input);
    expect(pushSubscriptionRepository.upsertByEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "userB", endpoint: "e1" })
    );
  });

  it("subscribe rejects when feature disabled", async () => {
    const { service, pushSubscriptionRepository } = setup({ pushWatchLimit: 0 });
    await expect(service.subscribe(input)).rejects.toMatchObject({ code: "FEATURE_DISABLED" });
    expect(pushSubscriptionRepository.upsertByEndpoint).not.toHaveBeenCalled();
  });

  it("unsubscribe only deletes the caller's own endpoint", async () => {
    const { service, pushSubscriptionRepository } = setup();
    await service.unsubscribe("u1", "e1");
    expect(pushSubscriptionRepository.deleteByEndpoint).toHaveBeenCalledWith("e1", "u1");
  });

  it("unsubscribe still deletes while feature is disabled so logout cleans up", async () => {
    const { service, pushSubscriptionRepository } = setup({ pushWatchLimit: 0 });
    await service.unsubscribe("u1", "e1");
    expect(pushSubscriptionRepository.deleteByEndpoint).toHaveBeenCalledWith("e1", "u1");
  });

  it("regenerateVapidKeys saves both keys and deletes all subscriptions", async () => {
    const { service, pushSubscriptionRepository, globalSettingsService } = setup();
    await expect(service.regenerateVapidKeys()).resolves.toEqual({ publicKey: "P" });
    expect(globalSettingsService.update).toHaveBeenCalledWith({
      vapidPublicKey: "P",
      vapidPrivateKey: "S",
    });
    expect(pushSubscriptionRepository.deleteAll).toHaveBeenCalled();
  });

  it("regenerateVapidKeys works while feature is disabled", async () => {
    const { service } = setup({ pushWatchLimit: 0, vapidPublicKey: null, vapidPrivateKey: null });
    await expect(service.regenerateVapidKeys()).resolves.toEqual({ publicKey: "P" });
  });
});
