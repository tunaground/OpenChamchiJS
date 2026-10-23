import { createPushNotifier, SendPush } from "@/lib/push/notifier";
import { ThreadWatchRepository } from "@/lib/repositories/interfaces/thread-watch";
import {
  PushSubscriptionRepository,
  PushSubscriptionData,
} from "@/lib/repositories/interfaces/push-subscription";
import { GlobalSettingsService } from "@/lib/services/global-settings";
import { GlobalSettingsData } from "@/lib/repositories/interfaces/global-settings";

describe("PushNotifier", () => {
  afterEach(() => jest.restoreAllMocks());

  const enabledSettings = {
    pushWatchLimit: 10,
    vapidPublicKey: "pub",
    vapidPrivateKey: "priv",
    vapidSubject: "mailto:a@b.c",
    pushCooldownSeconds: 60,
  } as GlobalSettingsData;

  const sub = (id: string, userId: string, locale: string | null): PushSubscriptionData => ({
    id, userId, endpoint: `https://push/${id}`, p256dh: "p", auth: "a", locale,
  });

  const message = {
    responseId: "resp-1",
    authorUserId: null as string | null,
    username: "참치",
    content: "안녕 [spo]비밀[/spo]",
    hasAttachment: false,
  };

  function setup(settings: Partial<GlobalSettingsData> = {}) {
    const threadWatchRepository = {
      claimRecipients: jest.fn().mockResolvedValue([{ userId: "u1", title: "Hello", boardId: "free" }]),
    } as unknown as jest.Mocked<ThreadWatchRepository>;
    const pushSubscriptionRepository: jest.Mocked<PushSubscriptionRepository> = {
      upsertByEndpoint: jest.fn(),
      findByUserIds: jest.fn().mockResolvedValue([sub("s1", "u1", "ja"), sub("s2", "u1", null)]),
      deleteByEndpoint: jest.fn(),
      deleteByIds: jest.fn(),
      deleteAll: jest.fn(),
      touch: jest.fn(),
    };
    const globalSettingsService = {
      get: jest.fn().mockResolvedValue({ ...enabledSettings, ...settings }),
    } as unknown as jest.Mocked<GlobalSettingsService>;
    const sendPush: jest.MockedFunction<SendPush> = jest.fn().mockResolvedValue({ ok: true });
    const notifier = createPushNotifier({
      threadWatchRepository,
      pushSubscriptionRepository,
      globalSettingsService,
      sendPush,
    });
    return { notifier, threadWatchRepository, pushSubscriptionRepository, sendPush };
  }

  it("does nothing when feature disabled", async () => {
    const { notifier, threadWatchRepository } = setup({ pushWatchLimit: 0 });
    await notifier.notifyThread(1, message);
    expect(threadWatchRepository.claimRecipients).not.toHaveBeenCalled();
  });

  it("passes author userId and the configured cooldown to claimRecipients", async () => {
    const { notifier, threadWatchRepository } = setup({ pushCooldownSeconds: 120 });
    await notifier.notifyThread(1, { ...message, authorUserId: "author" });
    expect(threadWatchRepository.claimRecipients).toHaveBeenCalledWith(1, "author", 120);
  });

  it("sends author and excerpt to every subscription with a per-reply tag", async () => {
    const { notifier, sendPush } = setup();
    await notifier.notifyThread(1, message);
    expect(sendPush).toHaveBeenCalledTimes(2);
    const payloads = sendPush.mock.calls.map((c) => JSON.parse(c[1]));
    expect(payloads[0]).toEqual({
      threadId: 1,
      title: "Hello",
      body: "참치: 안녕 ▒▒▒",
      url: "/trace/free/1/recent",
      tag: "s1:r-resp-1",
    });
    // Unique per subscription and reply: never replaces an earlier notification
    expect(payloads[1].tag).toBe("s2:r-resp-1");
    expect(sendPush.mock.calls[0][2]).toEqual({
      publicKey: "pub", privateKey: "priv", subject: "mailto:a@b.c",
    });
  });

  it("uses the subscription locale's image label for attachment-only replies", async () => {
    const { notifier, sendPush } = setup();
    await notifier.notifyThread(1, { ...message, content: "", hasAttachment: true });
    const bodies = sendPush.mock.calls.map((c) => JSON.parse(c[1]).body);
    expect(bodies).toEqual(["참치: (画像)", "참치: (이미지)"]);
  });

  it("does not look up subscriptions when nobody was claimed", async () => {
    const { notifier, threadWatchRepository, pushSubscriptionRepository } = setup();
    threadWatchRepository.claimRecipients.mockResolvedValue([]);
    await notifier.notifyThread(1, message);
    expect(pushSubscriptionRepository.findByUserIds).not.toHaveBeenCalled();
  });

  it.each([404, 410, 401, 403])("deletes subscriptions on %i", async (statusCode) => {
    const { notifier, sendPush, pushSubscriptionRepository } = setup();
    sendPush.mockResolvedValueOnce({ ok: false, statusCode }).mockResolvedValueOnce({ ok: true });
    await notifier.notifyThread(1, message);
    expect(pushSubscriptionRepository.deleteByIds).toHaveBeenCalledWith(["s1"]);
  });

  it("keeps subscriptions on 500", async () => {
    const { notifier, sendPush, pushSubscriptionRepository } = setup();
    sendPush.mockResolvedValue({ ok: false, statusCode: 500 });
    jest.spyOn(console, "error").mockImplementation(() => {});
    await notifier.notifyThread(1, message);
    expect(pushSubscriptionRepository.deleteByIds).not.toHaveBeenCalledWith(
      expect.arrayContaining(["s1"])
    );
  });

  it("does not throw when sendPush rejects", async () => {
    const { notifier, sendPush } = setup();
    sendPush.mockRejectedValue(new Error("network"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(notifier.notifyThread(1, message)).resolves.toBeUndefined();
  });

  it("touches successfully delivered subscriptions", async () => {
    const { notifier, sendPush, pushSubscriptionRepository } = setup();
    sendPush.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false, statusCode: 500 });
    jest.spyOn(console, "error").mockImplementation(() => {});
    await notifier.notifyThread(1, message);
    expect(pushSubscriptionRepository.touch).toHaveBeenCalledWith(["s1"]);
  });
});
