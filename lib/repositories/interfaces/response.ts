export interface ResponseData {
  id: string;
  threadId: number;
  boardId: string;
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

export interface ResponseWithUser extends ResponseData {
  user?: { id: string; name: string | null; email?: string | null } | null;
  thread?: { id: number; title: string };
}

export interface AdminResponseFilter {
  username?: string;
  authorId?: string;
  email?: string;
}

export interface AdminResponseCursor {
  createdAt: string;  // ISO string
  id: string;
}

export interface FindByBoardIdOptions {
  limit?: number;
  cursor?: AdminResponseCursor | null;
  includeDeleted?: boolean;
  filter?: AdminResponseFilter;
}

export interface FindByBoardIdResult {
  data: ResponseWithUser[];
  hasMore: boolean;
  nextCursor: AdminResponseCursor | null;
}

export interface CreateResponseInput {
  threadId: number;
  boardId?: string;  // Optional: service fills from thread, repository requires it
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

export interface ContentSearchCursor {
  createdAt: string;  // ISO string for serialization
  id: string;
  scanned: number;    // total responses scanned so far
}

export interface ContentSearchResult {
  data: ResponseWithUser[];
  nextCursor: ContentSearchCursor | null;
  hasMore: boolean;
  scanned: number;  // total responses scanned so far (always available)
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
  findByBoardIdCursor(
    boardId: string,
    options?: FindByBoardIdOptions
  ): Promise<FindByBoardIdResult>;
  findByBoardIdChunked(
    boardId: string,
    contentSearch: string,
    options?: {
      limit?: number;
      cursor?: ContentSearchCursor | null;
      includeDeleted?: boolean;
    }
  ): Promise<ContentSearchResult>;
  create(data: CreateResponseInput): Promise<ResponseData>;
  update(id: string, data: UpdateResponseInput): Promise<ResponseData>;
  delete(id: string): Promise<ResponseData>;
  countByThreadId(threadId: number): Promise<number>;
}
