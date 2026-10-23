import type { GlobalSettingsData } from "@/lib/repositories/interfaces/global-settings";

export type PushFeatureSettings = Pick<
  GlobalSettingsData,
  "pushWatchLimit" | "vapidPublicKey" | "vapidPrivateKey" | "vapidSubject"
>;

/**
 * Web push is on only when the admin set a positive watch limit
 * and a complete VAPID key pair with subject.
 */
export function isPushFeatureEnabled(settings: PushFeatureSettings): boolean {
  return (
    settings.pushWatchLimit > 0 &&
    !!settings.vapidPublicKey &&
    !!settings.vapidPrivateKey &&
    !!settings.vapidSubject
  );
}
