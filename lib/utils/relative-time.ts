// Short "how long ago" labels for lists: "3분 전", "어제 21:44", "10월 3일", "2025. 2. 2."

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatRelativeTime(input: string | Date, locale = "ko", now: Date = new Date()): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const diff = now.getTime() - date.getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diff < MINUTE) return rtf.format(0, "second");
  if (diff < HOUR) return rtf.format(-Math.floor(diff / MINUTE), "minute");

  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / (24 * HOUR));
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);

  if (dayDiff === 0) return rtf.format(-Math.floor(diff / HOUR), "hour");
  if (dayDiff === 1) return `${rtf.format(-1, "day")} ${time}`;
  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
  }
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "numeric", day: "numeric" }).format(date);
}
