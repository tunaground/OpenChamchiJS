import ko from "@/lib/i18n/messages/ko.json";
import en from "@/lib/i18n/messages/en.json";
import ja from "@/lib/i18n/messages/ja.json";

const BODIES: Record<string, string> = {
  ko: ko.push.notificationBody,
  en: en.push.notificationBody,
  ja: ja.push.notificationBody,
};

/** Notification body in the locale saved with the device subscription (ko fallback). */
export function getPushBody(locale: string | null): string {
  return (locale && BODIES[locale]) || BODIES.ko;
}
