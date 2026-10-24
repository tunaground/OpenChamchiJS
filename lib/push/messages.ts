import ko from "@/lib/i18n/messages/ko.json";
import en from "@/lib/i18n/messages/en.json";
import ja from "@/lib/i18n/messages/ja.json";

const IMAGE_LABELS: Record<string, string> = {
  ko: ko.push.imageLabel,
  en: en.push.imageLabel,
  ja: ja.push.imageLabel,
};

/** Placeholder for images in a push excerpt, in the subscription's locale (ko fallback). */
export function getImageLabel(locale: string | null): string {
  return (locale && IMAGE_LABELS[locale]) || IMAGE_LABELS.ko;
}
