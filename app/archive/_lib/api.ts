import type { ArchiveThreadIndex, ArchiveThread } from "./types";

/**
 * Fetch board index (thread list)
 */
export async function fetchArchiveIndex(
  baseUrl: string,
  boardId: string
): Promise<ArchiveThreadIndex[]> {
  const url = `${baseUrl}/${boardId}/index.json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch archive index: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch thread detail
 */
export async function fetchArchiveThread(
  baseUrl: string,
  boardId: string,
  threadId: number
): Promise<ArchiveThread> {
  const url = `${baseUrl}/${boardId}/${threadId}.json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch archive thread: ${res.status}`);
  }

  return res.json();
}

/**
 * Check if archive thread exists
 */
export async function checkArchiveExists(
  baseUrl: string,
  boardId: string,
  threadId: number
): Promise<boolean> {
  try {
    const url = `${baseUrl}/${boardId}/${threadId}.json`;
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get attachment URL
 */
export function getAttachmentUrl(baseUrl: string, boardId: string, filename: string): string {
  return `${baseUrl}/${boardId}/attachment/${encodeURIComponent(filename)}`;
}
