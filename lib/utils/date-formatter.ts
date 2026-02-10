const DAY_NAMES: Record<string, string[]> = {
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ja: ["日", "月", "火", "水", "木", "金", "土"],
};

function getDayName(date: Date, locale: string): string {
  const names = DAY_NAMES[locale] || DAY_NAMES["ko"];
  return names[date.getDay()];
}

/**
 * Format a date string to "YYYY-MM-DD (요일) HH:mm:ss" format.
 * @param dateInput - Date string, Date object, or any value that can be converted to Date
 * @param locale - Locale for day name (ko, en, ja)
 * @returns Formatted date string
 */
export function formatDateTime(dateInput: string | Date, locale: string = "ko"): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const dayName = getDayName(date, locale);
  return `${year}-${month}-${day} (${dayName}) ${hours}:${minutes}:${seconds}`;
}

/**
 * Format a date string to "YYYY-MM-DD (요일)" format.
 * @param dateInput - Date string, Date object, or any value that can be converted to Date
 * @param locale - Locale for day name (ko, en, ja)
 * @returns Formatted date string
 */
export function formatDate(dateInput: string | Date, locale: string = "ko"): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dayName = getDayName(date, locale);
  return `${year}-${month}-${day} (${dayName})`;
}

/**
 * Format a date string to "HH:mm:ss" format.
 * @param dateInput - Date string, Date object, or any value that can be converted to Date
 * @returns Formatted time string
 */
export function formatTime(dateInput: string | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
