import { unstable_cache, revalidateTag } from "next/cache";

/**
 * Helper to convert a Date or string to ISO string
 * Handles cached data where Dates are serialized to strings
 */
export function toISOString(date: Date | string): string {
  return typeof date === "string" ? date : date.toISOString();
}

// Cache tags for different entities
export const CACHE_TAGS = {
  // Board tags
  boards: "boards",
  board: (id: string) => `board-${id}`,

  // Thread tags
  threads: "threads",
  threadsByBoard: (boardId: string) => `threads-${boardId}`,
  thread: (id: number) => `thread-${id}`,

  // Response tags
  responses: (threadId: number) => `responses-${threadId}`,

  // Notice tags
  notices: "notices",
  noticesByBoard: (boardId: string) => `notices-${boardId}`,
  notice: (id: number) => `notice-${id}`,

  // Global settings
  settings: "settings",
} as const;

// All top-level cache tags for bulk invalidation
export const ALL_CACHE_TAGS = [
  CACHE_TAGS.boards,
  CACHE_TAGS.threads,
  CACHE_TAGS.notices,
  CACHE_TAGS.settings,
] as const;

/**
 * Cached wrapper function for database queries
 * Uses Next.js unstable_cache with tag-based revalidation
 */
export function cached<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  tags: string[]
): Promise<T> {
  return unstable_cache(fn, keyParts, { tags })();
}

/**
 * Revalidate cache by tag
 * In Next.js 16, revalidateTag requires a profile parameter
 */
export function invalidateCache(tag: string): void {
  revalidateTag(tag, {});
}

/**
 * Revalidate multiple cache tags
 */
export function invalidateCaches(tags: string[]): void {
  for (const tag of tags) {
    revalidateTag(tag, {});
  }
}

/**
 * Invalidate all caches
 */
export function invalidateAllCaches(): void {
  invalidateCaches([...ALL_CACHE_TAGS]);
}
