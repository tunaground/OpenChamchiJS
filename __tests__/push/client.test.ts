import {
  urlBase64ToUint8Array,
  isSameKey,
  postSubscription,
  syncDeviceSubscription,
} from "@/lib/push/client";

jest.mock("next-auth/react", () => ({ signOut: jest.fn() }));

describe("urlBase64ToUint8Array", () => {
  it("decodes URL-safe base64 without padding", () => {
    // bytes 0xfb 0xff 0xfe -> standard "+//+", URL-safe "-__-"
    expect(Array.from(urlBase64ToUint8Array("-__-"))).toEqual([0xfb, 0xff, 0xfe]);
  });

  it("restores missing padding", () => {
    expect(Array.from(urlBase64ToUint8Array("AQI"))).toEqual([1, 2]);
  });
});

describe("isSameKey", () => {
  const key = "AQID"; // [1,2,3]

  it("is true for the same key bytes", () => {
    expect(isSameKey(new Uint8Array([1, 2, 3]).buffer, key)).toBe(true);
  });

  it("is false for different key bytes", () => {
    expect(isSameKey(new Uint8Array([1, 2, 4]).buffer, key)).toBe(false);
  });

  it("is false for different length", () => {
    expect(isSameKey(new Uint8Array([1, 2]).buffer, key)).toBe(false);
  });

  it("is false for null", () => {
    expect(isSameKey(null, key)).toBe(false);
  });
});

describe("postSubscription", () => {
  const subscription = {
    toJSON: () => ({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "p", auth: "a" } }),
  } as unknown as PushSubscription;

  afterEach(() => jest.restoreAllMocks());

  it("throws when the server rejects the subscription", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 }) as jest.Mock;
    await expect(postSubscription(subscription, "ko")).rejects.toThrow();
  });

  it("resolves when the server accepts the subscription", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 }) as jest.Mock;
    await expect(postSubscription(subscription, "ko")).resolves.toBeUndefined();
  });
});

describe("syncDeviceSubscription", () => {
  it("runs at most once per page load", async () => {
    const getRegistration = jest.fn().mockResolvedValue({
      pushManager: { getSubscription: jest.fn().mockResolvedValue(null) },
    });
    Object.assign(global, {
      window: { __RUNTIME_CONFIG__: { pushEnabled: true, vapidPublicKey: "AQID" }, PushManager: {}, Notification: {} },
      navigator: { serviceWorker: { getRegistration, register: jest.fn() } },
      Notification: { permission: "granted" },
    });
    await syncDeviceSubscription("ko");
    await syncDeviceSubscription("ko");
    expect(getRegistration).toHaveBeenCalledTimes(1);
  });
});
