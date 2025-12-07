export interface ThreadData {
  id: number;
  boardId: string;
  title: string;
  password: string;
  username: string;
  ended: boolean;
  deleted: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  top: boolean;
}

export interface ThreadWithResponseCount extends ThreadData {
  responseCount: number;
}

export interface CreateThreadInput {
  boardId: string;
  title: string;
  password: string;
  username: string;
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

export interface ThreadRepository {
  findByBoardId(boardId: string, options?: FindThreadOptions): Promise<ThreadData[]>;
  findByBoardIdWithResponseCount(boardId: string, options?: FindThreadOptions): Promise<ThreadWithResponseCount[]>;
  countByBoardId(boardId: string, options?: { includeDeleted?: boolean; search?: string }): Promise<number>;
  findById(id: number): Promise<ThreadData | null>;
  create(data: CreateThreadInput): Promise<ThreadData>;
  update(id: number, data: UpdateThreadInput): Promise<ThreadData>;
  delete(id: number): Promise<ThreadData>;
  updateBumpTime(id: number): Promise<ThreadData>;
}
