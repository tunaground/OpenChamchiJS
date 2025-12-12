import { ARCHIVE_CONFIG } from "./config";
import type { ArchiveThreadIndex, ArchiveThread } from "./types";

/**
 * Fetch board index (thread list)
 */
export async function fetchArchiveIndex(
  boardId: string
): Promise<ArchiveThreadIndex[]> {
  const url = `${ARCHIVE_CONFIG.baseUrl}/${boardId}/index.json`;
  const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1 hour

  if (!res.ok) {
    throw new Error(`Failed to fetch archive index: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch thread detail
 */
export async function fetchArchiveThread(
  boardId: string,
  threadId: number
): Promise<ArchiveThread> {
  const url = `${ARCHIVE_CONFIG.baseUrl}/${boardId}/${threadId}.json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`Failed to fetch archive thread: ${res.status}`);
  }

  return res.json();
}

/**
 * Check if archive thread exists
 */
export async function checkArchiveExists(
  boardId: string,
  threadId: number
): Promise<boolean> {
  try {
    const url = `${ARCHIVE_CONFIG.baseUrl}/${boardId}/${threadId}.json`;
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get attachment URL
 */
export function getAttachmentUrl(boardId: string, filename: string): string {
  return `${ARCHIVE_CONFIG.baseUrl}/${boardId}/attachment/${encodeURIComponent(filename)}`;
}
