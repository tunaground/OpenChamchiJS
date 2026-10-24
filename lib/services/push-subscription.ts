import webpush from "web-push";
import { pushSubscriptionRepository as defaultPushSubscriptionRepository } from "@/lib/repositories/prisma/push-subscription";
import {
  PushSubscriptionRepository,
  UpsertPushSubscriptionInput,
} from "@/lib/repositories/interfaces/push-subscription";
import {
  globalSettingsService as defaultGlobalSettingsService,
  GlobalSettingsService,
} from "@/lib/services/global-settings";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";
import { isPushFeatureEnabled } from "@/lib/push/feature";

export class PushSubscriptionServiceError extends ServiceError {
  constructor(message: string, code: ServiceErrorCode) {
    super(message, code);
    this.name = "PushSubscriptionServiceError";
  }
}

export interface PushSubscriptionService {
  subscribe(input: UpsertPushSubscriptionInput): Promise<void>;
  unsubscribe(userId: string, endpoint: string): Promise<void>;
  regenerateVapidKeys(): Promise<{ publicKey: string }>;
}

interface PushSubscriptionServiceDeps {
  pushSubscriptionRepository: PushSubscriptionRepository;
  globalSettingsService: GlobalSettingsService;
  generateVapidKeys: () => { publicKey: string; privateKey: string };
}

export function createPushSubscriptionService(
  deps: PushSubscriptionServiceDeps
): PushSubscriptionService {
  const { pushSubscriptionRepository, globalSettingsService, generateVapidKeys } = deps;

  async function requireFeature() {
    const settings = await globalSettingsService.get();
    if (!isPushFeatureEnabled(settings)) {
      throw new PushSubscriptionServiceError("Web push is disabled", "FEATURE_DISABLED");
    }
  }

  return {
    async subscribe(input: UpsertPushSubscriptionInput): Promise<void> {
      await requireFeature();
      await pushSubscriptionRepository.upsertByEndpoint(input);
    },

    // Allowed while the feature is off so logout always detaches the device
    async unsubscribe(userId: string, endpoint: string): Promise<void> {
      await pushSubscriptionRepository.deleteByEndpoint(endpoint, userId);
    },

    // Works while the feature is off: keys are a prerequisite for turning it on
    async regenerateVapidKeys(): Promise<{ publicKey: string }> {
      const { publicKey, privateKey } = generateVapidKeys();
      await globalSettingsService.update({
        vapidPublicKey: publicKey,
        vapidPrivateKey: privateKey,
      });
      // Subscriptions made with the old key can no longer be delivered
      await pushSubscriptionRepository.deleteAll();
      return { publicKey };
    },
  };
}

export const pushSubscriptionService = createPushSubscriptionService({
  pushSubscriptionRepository: defaultPushSubscriptionRepository,
  globalSettingsService: defaultGlobalSettingsService,
  generateVapidKeys: () => webpush.generateVAPIDKeys(),
});
