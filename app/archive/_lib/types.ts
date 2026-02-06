/**
 * Archive Data Types
 */

export interface ArchiveThreadIndex {
  version: string;
  boardId: string;
  threadId: number;
  title: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  size: number;
}

export interface ArchiveResponse {
  threadId: number;
  sequence: number;
  username: string;
  userId: string;
  createdAt: string;
  content: string; // Already HTML
  attachment: string;
  youtube: string;
}

export interface ArchiveThread {
  version: string;
  boardId: string;
  threadId: number;
  title: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  size: number;
  responses: ArchiveResponse[];
}
