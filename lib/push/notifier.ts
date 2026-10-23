import { threadWatchRepository as defaultThreadWatchRepository } from "@/lib/repositories/prisma/thread-watch";
import { pushSubscriptionRepository as defaultPushSubscriptionRepository } from "@/lib/repositories/prisma/push-subscription";
import { ThreadWatchRepository } from "@/lib/repositories/interfaces/thread-watch";
import { PushSubscriptionRepository } from "@/lib/repositories/interfaces/push-subscription";
import {
  globalSettingsService as defaultGlobalSettingsService,
  GlobalSettingsService,
} from "@/lib/services/global-settings";
import { isPushFeatureEnabled } from "@/lib/push/feature";
import { getPushBody } from "@/lib/push/messages";
import { sendWebPush } from "@/lib/push/web-push-sender";

export type SendPush = (
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapid: { publicKey: string; privateKey: string; subject: string }
) => Promise<{ ok: true } | { ok: false; statusCode?: number }>;

// Push service responses meaning the subscription is gone or bound to an old key
const EXPIRED_STATUS = new Set([401, 403, 404, 410]);

export interface PushNotifier {
  notifyThread(threadId: number, authorUserId: string | null): Promise<void>;
}

interface PushNotifierDeps {
  threadWatchRepository: ThreadWatchRepository;
  pushSubscriptionRepository: PushSubscriptionRepository;
  globalSettingsService: GlobalSettingsService;
  sendPush: SendPush;
}

export function createPushNotifier(deps: PushNotifierDeps): PushNotifier {
  const { threadWatchRepository, pushSubscriptionRepository, globalSettingsService, sendPush } = deps;

  return {
    async notifyThread(threadId: number, authorUserId: string | null): Promise<void> {
      try {
        const settings = await globalSettingsService.get();
        if (!isPushFeatureEnabled(settings)) return;

        // Atomically applies cooldown, viewing and toggle filters
        const recipients = await threadWatchRepository.claimRecipients(threadId, authorUserId);
        if (recipients.length === 0) return;

        const byUser = new Map(recipients.map((r) => [r.userId, r]));
        const subscriptions = await pushSubscriptionRepository.findByUserIds([...byUser.keys()]);

        const vapid = {
          publicKey: settings.vapidPublicKey!,
          privateKey: settings.vapidPrivateKey!,
          subject: settings.vapidSubject!,
        };

        const results = await Promise.allSettled(
          subscriptions.map((sub) => {
            const recipient = byUser.get(sub.userId)!;
            const payload = JSON.stringify({
              threadId,
              title: recipient.title,
              body: getPushBody(sub.locale),
              url: `/trace/${recipient.boardId}/${threadId}/recent`,
              // Scoped per subscription: a re-registered worker gets a new subscription,
              // so stale notifications of the old worker never capture this tag
              tag: `${sub.id}:thread-${threadId}`,
            });
            return sendPush(sub, payload, vapid);
          })
        );

        const expired: string[] = [];
        const delivered: string[] = [];
        results.forEach((result, i) => {
          const id = subscriptions[i].id;
          if (result.status === "rejected") {
            console.error("Failed to send web push:", result.reason);
          } else if (result.value.ok) {
            delivered.push(id);
          } else if (result.value.statusCode && EXPIRED_STATUS.has(result.value.statusCode)) {
            expired.push(id);
          } else {
            console.error("Web push rejected with status:", result.value.statusCode);
          }
        });

        await Promise.all([
          pushSubscriptionRepository.deleteByIds(expired),
          pushSubscriptionRepository.touch(delivered),
        ]);
      } catch (error) {
        console.error("Failed to notify thread watchers:", error);
      }
    },
  };
}

export const pushNotifier = createPushNotifier({
  threadWatchRepository: defaultThreadWatchRepository,
  pushSubscriptionRepository: defaultPushSubscriptionRepository,
  globalSettingsService: defaultGlobalSettingsService,
  sendPush: sendWebPush,
});
