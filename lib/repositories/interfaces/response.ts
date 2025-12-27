export interface ResponseData {
  id: string;
  threadId: number;
  seq: number;
  username: string;
  authorId: string;
  userId: string | null;
  ip: string;
  content: string;
  attachment: string | null;
  visible: boolean;
  deleted: boolean;
  createdAt: Date;
}

export interface CreateResponseInput {
  threadId: number;
  username: string;
  authorId: string;
  userId?: string;
  ip: string;
  content: string;
  attachment?: string;
  noup?: boolean;
}

export interface UpdateResponseInput {
  content?: string;
  attachment?: string;
  visible?: boolean;
  deleted?: boolean;
}

export interface FindBySeqRangeOptions {
  startSeq: number;
  endSeq: number;
  includeDeleted?: boolean;
}

export interface FindRecentOptions {
  limit: number;
  includeDeleted?: boolean;
}

export interface ResponseFilter {
  usernames?: string[];
  authorIds?: string[];
}

export interface ResponseRepository {
  findByThreadId(
    threadId: number,
    options?: { limit?: number; offset?: number; includeDeleted?: boolean; includeHidden?: boolean; filter?: ResponseFilter }
  ): Promise<ResponseData[]>;
  findById(id: string): Promise<ResponseData | null>;
  findByThreadIdAndSeq(threadId: number, seq: number): Promise<ResponseData | null>;
  findByThreadIdAndSeqRange(
    threadId: number,
    options: FindBySeqRangeOptions & { filter?: ResponseFilter }
  ): Promise<ResponseData[]>;
  findRecentByThreadId(
    threadId: number,
    options: FindRecentOptions & { filter?: ResponseFilter }
  ): Promise<ResponseData[]>;
  create(data: CreateResponseInput): Promise<ResponseData>;
  update(id: string, data: UpdateResponseInput): Promise<ResponseData>;
  delete(id: string): Promise<ResponseData>;
  countByThreadId(threadId: number): Promise<number>;
}
