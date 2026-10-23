import webpush, { WebPushError } from "web-push";
import type { SendPush } from "@/lib/push/notifier";
import { isAllowedPushEndpoint } from "@/lib/push/endpoint";

export const sendWebPush: SendPush = async (sub, payload, vapid) => {
  // Treat a non-push-service endpoint as gone so the notifier deletes it
  if (!isAllowedPushEndpoint(sub.endpoint)) {
    return { ok: false, statusCode: 410 };
  }
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
      {
        TTL: 3600,
        urgency: "normal",
        vapidDetails: {
          subject: vapid.subject,
          publicKey: vapid.publicKey,
          privateKey: vapid.privateKey,
        },
      }
    );
    return { ok: true };
  } catch (error) {
    if (error instanceof WebPushError) {
      return { ok: false, statusCode: error.statusCode };
    }
    throw error;
  }
};
