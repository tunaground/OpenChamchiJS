/**
 * Anonymous ID utilities for identifying the current user
 * without authentication (stored in localStorage)
 */

const ANON_ID_KEY = "anonId";

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
    anonId = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}
