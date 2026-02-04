import { PaginationParams } from "@/lib/types/pagination";

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

export interface FindNoticeOptions extends PaginationParams {
  includeDeleted?: boolean;
  search?: string;
}

export interface FindByBoardIdWithCountResult {
  data: NoticeData[];
  total: number;
}

export interface NoticeRepository {
  findByBoardId(boardId: string, options?: FindNoticeOptions): Promise<NoticeData[]>;
  findByBoardIdWithCount(boardId: string, options?: FindNoticeOptions): Promise<FindByBoardIdWithCountResult>;
  countByBoardId(boardId: string, options?: { includeDeleted?: boolean; search?: string }): Promise<number>;
  findById(id: number): Promise<NoticeData | null>;
  create(data: CreateNoticeInput): Promise<NoticeData>;
  update(id: number, data: UpdateNoticeInput): Promise<NoticeData>;
  delete(id: number): Promise<NoticeData>;
}
