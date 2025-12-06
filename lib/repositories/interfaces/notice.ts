export interface NoticeData {
  id: number;
  boardId: string;
  title: string;
  content: string;
  pinned: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoticeInput {
  boardId: string;
  title: string;
  content: string;
  pinned?: boolean;
}

export interface UpdateNoticeInput {
  title?: string;
  content?: string;
  pinned?: boolean;
  deleted?: boolean;
}

export interface NoticeRepository {
  findByBoardId(boardId: string): Promise<NoticeData[]>;
  findById(id: number): Promise<NoticeData | null>;
  create(data: CreateNoticeInput): Promise<NoticeData>;
  update(id: number, data: UpdateNoticeInput): Promise<NoticeData>;
  delete(id: number): Promise<NoticeData>;
}
