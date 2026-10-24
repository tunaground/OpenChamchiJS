import { pushSubscriptionSchema } from "@/lib/schemas";

const valid = {
  keys: { p256dh: "p".repeat(87), auth: "a".repeat(22) },
  locale: "ko" as const,
};

describe("pushSubscriptionSchema endpoint", () => {
  it.each([
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://wns2-par02p.notify.windows.com/w/?token=abc",
    "https://web.push.apple.com/abc",
  ])("accepts push service %s", (endpoint) => {
    expect(pushSubscriptionSchema.safeParse({ ...valid, endpoint }).success).toBe(true);
  });

  it.each([
    "http://fcm.googleapis.com/fcm/send/abc",
    "https://169.254.169.254/latest/meta-data",
    "https://ws:8080/publish",
    "https://evil.example/googleapis.com",
    "https://googleapis.com.evil.example/x",
  ])("rejects non-push-service endpoint %s", (endpoint) => {
    expect(pushSubscriptionSchema.safeParse({ ...valid, endpoint }).success).toBe(false);
  });
});
