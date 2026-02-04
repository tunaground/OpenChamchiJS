export interface ThreadData {
  id: number;
  boardId: string;
  title: string;
  password: string;
  username: string;
  userId: string | null;
  ended: boolean;
  deleted: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  top: boolean;
  responseCount: number;
}

export type ThreadWithResponseCount = ThreadData;

export interface CreateThreadInput {
  boardId: string;
  title: string;
  password: string;
  username: string;
  userId?: string;
}

export interface UpdateThreadInput {
  title?: string;
  ended?: boolean;
  deleted?: boolean;
  top?: boolean;
}

export interface FindThreadOptions {
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  search?: string;
}

export interface FindByBoardIdWithCountResult {
  data: ThreadWithResponseCount[];
  total: number;
}

export interface ThreadRepository {
  findByBoardId(boardId: string, options?: FindThreadOptions): Promise<ThreadData[]>;
  findByBoardIdWithResponseCount(boardId: string, options?: FindThreadOptions): Promise<ThreadWithResponseCount[]>;
  findByBoardIdWithCount(boardId: string, boardThreadCount: number, options?: FindThreadOptions): Promise<FindByBoardIdWithCountResult>;
  countByBoardId(boardId: string, options?: { includeDeleted?: boolean; search?: string }): Promise<number>;
  findById(id: number): Promise<ThreadData | null>;
  create(data: CreateThreadInput): Promise<ThreadData>;
  update(id: number, data: UpdateThreadInput): Promise<ThreadData>;
  delete(id: number): Promise<ThreadData>;
  updateBumpTime(id: number): Promise<ThreadData>;
}
