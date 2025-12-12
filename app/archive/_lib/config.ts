/**
 * Archive Configuration
 */
export const ARCHIVE_CONFIG = {
  // Data source URL
  baseUrl: "https://archive-data.tunaground.net/data",

  // Available boards
  boards: [
    { id: "tuna", name: "Tuna" },
    { id: "situplay", name: "Situplay" },
    { id: "anchor", name: "Anchor" },
  ],

  // Pagination
  threadsPerPage: 20,
} as const;

export type BoardId = (typeof ARCHIVE_CONFIG.boards)[number]["id"];
