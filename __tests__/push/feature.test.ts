import { isPushFeatureEnabled } from "@/lib/push/feature";

describe("isPushFeatureEnabled", () => {
  const full = {
    pushWatchLimit: 10,
    vapidPublicKey: "pub",
    vapidPrivateKey: "priv",
    vapidSubject: "mailto:a@b.c",
  };

  it("is enabled when limit > 0 and all VAPID fields set", () => {
    expect(isPushFeatureEnabled(full)).toBe(true);
  });

  it("is disabled when limit is 0", () => {
    expect(isPushFeatureEnabled({ ...full, pushWatchLimit: 0 })).toBe(false);
  });

  it.each(["vapidPublicKey", "vapidPrivateKey", "vapidSubject"])(
    "is disabled when %s missing",
    (key) => {
      expect(isPushFeatureEnabled({ ...full, [key]: null })).toBe(false);
    }
  );
});
