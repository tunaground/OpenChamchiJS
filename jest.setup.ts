// Mock Next.js cache functions
jest.mock("@/lib/cache", () => ({
  invalidateCache: jest.fn(),
  invalidateCaches: jest.fn(),
  invalidateAllCaches: jest.fn(),
  cached: jest.fn((fn: () => Promise<unknown>) => fn()),
  CACHE_TAGS: {
    boards: "boards",
    board: (id: string) => `board-${id}`,
    threads: "threads",
    threadsByBoard: (boardId: string) => `threads-${boardId}`,
    thread: (id: number) => `thread-${id}`,
    responses: (threadId: number) => `responses-${threadId}`,
    notices: "notices",
    noticesByBoard: (boardId: string) => `notices-${boardId}`,
    notice: (id: number) => `notice-${id}`,
    settings: "settings",
  },
  ALL_CACHE_TAGS: ["boards", "threads", "notices", "settings"],
  toISOString: (date: Date | string) =>
    typeof date === "string" ? date : date.toISOString(),
}));
