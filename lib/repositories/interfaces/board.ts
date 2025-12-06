export interface BoardData {
  id: string;
  name: string;
  deleted: boolean;
  maxResponsesPerThread: number;
  blockForeignIp: boolean;
  responsesPerPage: number;
  showUserCount: boolean;
  threadsPerPage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardInput {
  id: string;
  name: string;
  maxResponsesPerThread?: number;
  blockForeignIp?: boolean;
  responsesPerPage?: number;
  showUserCount?: boolean;
  threadsPerPage?: number;
}

export interface UpdateBoardInput {
  name?: string;
  deleted?: boolean;
  maxResponsesPerThread?: number;
  blockForeignIp?: boolean;
  responsesPerPage?: number;
  showUserCount?: boolean;
  threadsPerPage?: number;
}

export interface ConfigBoardInput {
  maxResponsesPerThread?: number;
  blockForeignIp?: boolean;
  responsesPerPage?: number;
  showUserCount?: boolean;
  threadsPerPage?: number;
}

export interface BoardWithThreadCount extends BoardData {
  threadCount: number;
}

export interface BoardRepository {
  findAll(): Promise<BoardData[]>;
  findAllWithThreadCount(): Promise<BoardWithThreadCount[]>;
  findById(id: string): Promise<BoardData | null>;
  create(data: CreateBoardInput): Promise<BoardData>;
  update(id: string, data: UpdateBoardInput): Promise<BoardData>;
  updateConfig(id: string, data: ConfigBoardInput): Promise<BoardData>;
}
