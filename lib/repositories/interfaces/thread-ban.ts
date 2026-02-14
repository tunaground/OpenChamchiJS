export interface ThreadBanData {
  id: string;
  threadId: number;
  authorId: string;
  createdAt: Date;
}

export interface CreateThreadBanInput {
  threadId: number;
  authorId: string;
}

export interface ThreadBanRepository {
  findByThreadId(threadId: number): Promise<ThreadBanData[]>;
  findById(id: string): Promise<ThreadBanData | null>;
  isBanned(threadId: number, authorId: string): Promise<boolean>;
  createMany(data: CreateThreadBanInput[]): Promise<ThreadBanData[]>;
  delete(id: string): Promise<ThreadBanData>;
}
