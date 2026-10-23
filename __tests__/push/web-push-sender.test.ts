import webpush from "web-push";
import { sendWebPush } from "@/lib/push/web-push-sender";

jest.mock("web-push", () => ({
  __esModule: true,
  default: { sendNotification: jest.fn() },
  WebPushError: class extends Error {},
}));

describe("sendWebPush", () => {
  it("refuses to send to a non-push-service endpoint", async () => {
    await expect(
      sendWebPush(
        { endpoint: "http://169.254.169.254/x", p256dh: "p", auth: "a" },
        "{}",
        { publicKey: "P", privateKey: "S", subject: "mailto:a@b.c" }
      )
    ).resolves.toEqual({ ok: false, statusCode: 410 });
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });
});
