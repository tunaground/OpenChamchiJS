export interface ThreadData {
  id: number;
  boardId: string;
  title: string;
  password: string;
  username: string;
  ended: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  top: boolean;
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

export interface ThreadRepository {
  findByBoardId(boardId: string, options?: {
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }): Promise<ThreadData[]>;
  findById(id: number): Promise<ThreadData | null>;
  create(data: CreateThreadInput): Promise<ThreadData>;
  update(id: number, data: UpdateThreadInput): Promise<ThreadData>;
  delete(id: number): Promise<ThreadData>;
  updateBumpTime(id: number): Promise<ThreadData>;
}
