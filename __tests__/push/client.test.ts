import {
  urlBase64ToUint8Array,
  isSameKey,
  postSubscription,
  syncDeviceSubscription,
  getActiveRegistration,
  ensureDeviceSubscribed,
  prepareServiceWorker,
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

describe("getActiveRegistration", () => {
  it("waits for the newly registered worker to become active", async () => {
    const readyRegistration = { active: {} };
    const register = jest.fn().mockResolvedValue({ active: null, installing: {} });
    Object.assign(global, {
      navigator: {
        serviceWorker: {
          getRegistration: jest.fn().mockResolvedValue(undefined),
          register,
          ready: Promise.resolve(readyRegistration),
        },
      },
    });
    await expect(getActiveRegistration()).resolves.toBe(readyRegistration);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });
});

describe("ensureDeviceSubscribed", () => {
  function setupBrowser(subscribe: jest.Mock) {
    const registration = {
      active: {},
      pushManager: { subscribe, getSubscription: jest.fn().mockResolvedValue(null) },
    };
    const requestPermission = jest.fn().mockResolvedValue("granted");
    Object.assign(global, {
      window: { __RUNTIME_CONFIG__: { pushEnabled: true, vapidPublicKey: "AQID" }, PushManager: {}, Notification: {} },
      navigator: {
        serviceWorker: {
          getRegistration: jest.fn().mockResolvedValue(registration),
          register: jest.fn(),
          ready: Promise.resolve(registration),
        },
      },
      Notification: { permission: "default", requestPermission },
      fetch: jest.fn().mockResolvedValue({ ok: true, status: 204 }),
    });
    return { registration, requestPermission };
  }

  it("subscribes on a prepared worker without a separate permission prompt", async () => {
    const subscribe = jest.fn().mockResolvedValue({
      toJSON: () => ({ endpoint: "https://web.push.apple.com/x", keys: { p256dh: "p", auth: "a" } }),
    });
    const { requestPermission } = setupBrowser(subscribe);
    await prepareServiceWorker();
    await expect(ensureDeviceSubscribed("ko")).resolves.toBe("subscribed");
    expect(subscribe).toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("returns denied when the browser rejects the subscription", async () => {
    const subscribe = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error("User denied push permission"), { name: "NotAllowedError" }));
    setupBrowser(subscribe);
    await prepareServiceWorker();
    await expect(ensureDeviceSubscribed("ko")).resolves.toBe("denied");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns failed when subscription is rejected although permission is granted", async () => {
    const subscribe = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error("User denied push permission"), { name: "NotAllowedError" }));
    setupBrowser(subscribe);
    (global as unknown as { Notification: { permission: string } }).Notification.permission = "granted";
    await prepareServiceWorker();
    await expect(ensureDeviceSubscribed("ko")).resolves.toBe("failed");
  });
});
