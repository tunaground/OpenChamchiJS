/**
 * Archive Configuration
 */

function parseBoards(json: string | undefined): { id: string; name: string }[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export const ARCHIVE_CONFIG = {
  // Data source URL (from environment variable, NEXT_PUBLIC_ for client access)
  baseUrl: process.env.NEXT_PUBLIC_ARCHIVE_BASE_URL || "",

  // Available boards (from environment variable, NEXT_PUBLIC_ for client access)
  boards: parseBoards(process.env.NEXT_PUBLIC_ARCHIVE_BOARDS),

  // Pagination
  threadsPerPage: 20,
} as const;

export type BoardId = (typeof ARCHIVE_CONFIG.boards)[number]["id"];
