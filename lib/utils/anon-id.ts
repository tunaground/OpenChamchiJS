/**
 * Anonymous ID utilities for identifying the current user
 * without authentication (stored in localStorage)
 */

const ANON_ID_KEY = "anonId";

/**
 * RFC 4122 v4 UUID. crypto.randomUUID only exists in secure contexts
 * (HTTPS or localhost), so plain-HTTP access such as http://192.168.x.x
 * falls back to getRandomValues, which works everywhere.
 */
export function createUuid(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Get or create an anonymous ID for the current user
 * @returns The anonymous ID string
 */
export function getAnonId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = createUuid();
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}
