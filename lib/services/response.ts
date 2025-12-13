import bcrypt from "bcryptjs";
import {
  permissionService as defaultPermissionService,
  PermissionService,
} from "@/lib/services/permission";
import { responseRepository as defaultResponseRepository } from "@/lib/repositories/prisma/response";
import { threadRepository as defaultThreadRepository } from "@/lib/repositories/prisma/thread";
import { boardRepository as defaultBoardRepository } from "@/lib/repositories/prisma/board";
import {
  ResponseRepository,
  ResponseData,
  CreateResponseInput,
  UpdateResponseInput,
} from "@/lib/repositories/interfaces/response";
import { ThreadRepository } from "@/lib/repositories/interfaces/thread";
import { BoardRepository } from "@/lib/repositories/interfaces/board";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";
import { invalidateCache, CACHE_TAGS } from "@/lib/cache";

export class ResponseServiceError extends ServiceError {
  constructor(
    message: string,
    code: ServiceErrorCode
  ) {
    super(message, code);
    this.name = "ResponseServiceError";
  }
}

export type ResponseRangeType =
  | { type: "all" }
  | { type: "recent"; limit: number }
  | { type: "single"; seq: number }
  | { type: "range"; startSeq: number; endSeq: number };

export interface ResponseService {
  findByThreadId(
    threadId: number,
    options?: { limit?: number; offset?: number; includeDeleted?: boolean; includeHidden?: boolean }
  ): Promise<ResponseData[]>;
  findByRange(
    threadId: number,
    range: ResponseRangeType
  ): Promise<ResponseData[]>;
  findById(id: string): Promise<ResponseData>;
  create(data: CreateResponseInput): Promise<ResponseData>;
  update(
    userId: string,
    id: string,
    data: UpdateResponseInput
  ): Promise<ResponseData>;
  updateWithPassword(
    id: string,
    password: string,
    data: { visible?: boolean }
  ): Promise<ResponseData>;
  delete(
    userId: string | null,
    id: string,
    password?: string
  ): Promise<ResponseData>;
}

interface ResponseServiceDeps {
  responseRepository: ResponseRepository;
  threadRepository: ThreadRepository;
  boardRepository: BoardRepository;
  permissionService: PermissionService;
}

export function createResponseService(deps: ResponseServiceDeps): ResponseService {
  const { responseRepository, threadRepository, boardRepository, permissionService } = deps;

  async function checkResponsePermission(
    userId: string | null,
    boardId: string,
    action: "update" | "delete"
  ): Promise<boolean> {
    if (!userId) return false;

    return permissionService.checkUserPermissions(userId, [
      `response:${action}`,
      `response:${boardId}:${action}`,
    ]);
  }

  async function verifyThreadPassword(
    threadId: number,
    password?: string
  ): Promise<boolean> {
    if (!password) return false;
    const thread = await threadRepository.findById(threadId);
    if (!thread) return false;
    return bcrypt.compare(password, thread.password);
  }

  return {
    async findByThreadId(
      threadId: number,
      options?: { limit?: number; offset?: number; includeDeleted?: boolean; includeHidden?: boolean }
    ): Promise<ResponseData[]> {
      const thread = await threadRepository.findById(threadId);
      if (!thread || thread.deleted) {
        throw new ResponseServiceError("Thread not found", "NOT_FOUND");
      }

      return responseRepository.findByThreadId(threadId, options);
    },

    async findByRange(
      threadId: number,
      range: ResponseRangeType
    ): Promise<ResponseData[]> {
      const thread = await threadRepository.findById(threadId);
      if (!thread || thread.deleted) {
        throw new ResponseServiceError("Thread not found", "NOT_FOUND");
      }

      switch (range.type) {
        case "all":
          return responseRepository.findByThreadId(threadId, { limit: 10000 });
        case "recent":
          return responseRepository.findRecentByThreadId(threadId, {
            limit: range.limit,
          });
        case "single": {
          // Always include seq 0 (thread body) plus the requested seq
          const responses: ResponseData[] = [];
          const [firstResponse, singleResponse] = await Promise.all([
            responseRepository.findByThreadIdAndSeq(threadId, 0),
            range.seq === 0
              ? Promise.resolve(null)
              : responseRepository.findByThreadIdAndSeq(threadId, range.seq),
          ]);
          if (firstResponse && !firstResponse.deleted) {
            responses.push(firstResponse);
          }
          if (singleResponse && !singleResponse.deleted) {
            responses.push(singleResponse);
          }
          return responses;
        }
        case "range": {
          // If range doesn't include 0, we need to fetch it separately
          if (range.startSeq > 0) {
            const [firstResponse, rangeResponses] = await Promise.all([
              responseRepository.findByThreadIdAndSeq(threadId, 0),
              responseRepository.findByThreadIdAndSeqRange(threadId, {
                startSeq: range.startSeq,
                endSeq: range.endSeq,
              }),
            ]);
            const responses: ResponseData[] = [];
            if (firstResponse && !firstResponse.deleted) {
              responses.push(firstResponse);
            }
            responses.push(...rangeResponses);
            return responses;
          }
          return responseRepository.findByThreadIdAndSeqRange(threadId, {
            startSeq: range.startSeq,
            endSeq: range.endSeq,
          });
        }
      }
    },

    async findById(id: string): Promise<ResponseData> {
      const response = await responseRepository.findById(id);
      if (!response || response.deleted) {
        throw new ResponseServiceError("Response not found", "NOT_FOUND");
      }
      return response;
    },

    async create(data: CreateResponseInput): Promise<ResponseData> {
      const thread = await threadRepository.findById(data.threadId);
      if (!thread || thread.deleted) {
        throw new ResponseServiceError("Thread not found", "NOT_FOUND");
      }

      if (thread.ended) {
        throw new ResponseServiceError("Thread is ended", "BAD_REQUEST");
      }

      // Check maxResponsesPerThread limit
      const board = await boardRepository.findById(thread.boardId);
      if (!board) {
        throw new ResponseServiceError("Board not found", "NOT_FOUND");
      }

      // maxResponsesPerThread means max seq value (0-indexed)
      // So if maxResponsesPerThread is 1000, we allow seq 0~1000 (1001 total responses)
      const currentCount = await responseRepository.countByThreadId(data.threadId);
      if (currentCount > board.maxResponsesPerThread) {
        throw new ResponseServiceError("Thread has reached maximum responses", "BAD_REQUEST");
      }

      // Extract noup flag before passing to repository (repository doesn't need it)
      const { noup, ...repoData } = data;
      const response = await responseRepository.create(repoData);

      // If this response reaches the max limit, end the thread
      // seq starts from 0, so seq == maxResponsesPerThread means we have maxResponsesPerThread + 1 responses
      if (response.seq >= board.maxResponsesPerThread) {
        await threadRepository.update(data.threadId, { ended: true });
      } else if (!noup) {
        // 새 응답 추가 시 스레드 범프 (noup이 아닌 경우에만)
        await threadRepository.updateBumpTime(data.threadId);
      }

      // Invalidate cache
      invalidateCache(CACHE_TAGS.responses(data.threadId));
      invalidateCache(CACHE_TAGS.thread(data.threadId));

      return response;
    },

    async update(
      userId: string,
      id: string,
      data: UpdateResponseInput
    ): Promise<ResponseData> {
      const response = await responseRepository.findById(id);
      if (!response) {
        throw new ResponseServiceError("Response not found", "NOT_FOUND");
      }

      // If response is deleted, only allow restoring (setting deleted to false)
      if (response.deleted && data.deleted !== false) {
        throw new ResponseServiceError("Response not found", "NOT_FOUND");
      }

      // seq 0 (thread body) cannot be modified via response API
      if (response.seq === 0 && (data.visible !== undefined || data.deleted !== undefined)) {
        throw new ResponseServiceError("Cannot modify thread body response", "BAD_REQUEST");
      }

      const thread = await threadRepository.findById(response.threadId);
      if (!thread) {
        throw new ResponseServiceError("Thread not found", "NOT_FOUND");
      }

      const hasPermission = await checkResponsePermission(userId, thread.boardId, "update");
      if (!hasPermission) {
        throw new ResponseServiceError("Permission denied", "FORBIDDEN");
      }

      const result = await responseRepository.update(id, data);

      // Invalidate cache
      invalidateCache(CACHE_TAGS.responses(response.threadId));
      invalidateCache(CACHE_TAGS.thread(response.threadId));

      return result;
    },

    async updateWithPassword(
      id: string,
      password: string,
      data: { visible?: boolean }
    ): Promise<ResponseData> {
      const response = await responseRepository.findById(id);
      if (!response) {
        throw new ResponseServiceError("Response not found", "NOT_FOUND");
      }

      // seq 0 (thread body) cannot be modified via response API
      if (response.seq === 0) {
        throw new ResponseServiceError("Cannot modify thread body response", "BAD_REQUEST");
      }

      // Password holders can restore hidden responses, so we don't check response.deleted here
      // But they cannot restore deleted responses (deleted can only be managed by admins)
      if (response.deleted) {
        throw new ResponseServiceError("Response not found", "NOT_FOUND");
      }

      const passwordValid = await verifyThreadPassword(response.threadId, password);
      if (!passwordValid) {
        throw new ResponseServiceError("Invalid password", "FORBIDDEN");
      }

      const result = await responseRepository.update(id, { visible: data.visible });

      // Invalidate cache
      invalidateCache(CACHE_TAGS.responses(response.threadId));

      return result;
    },

    async delete(
      userId: string | null,
      id: string,
      password?: string
    ): Promise<ResponseData> {
      const response = await responseRepository.findById(id);
      if (!response || response.deleted) {
        throw new ResponseServiceError("Response not found", "NOT_FOUND");
      }

      // seq 0 (thread body) cannot be deleted via response API
      if (response.seq === 0) {
        throw new ResponseServiceError("Cannot delete thread body response", "BAD_REQUEST");
      }

      const thread = await threadRepository.findById(response.threadId);
      if (!thread) {
        throw new ResponseServiceError("Thread not found", "NOT_FOUND");
      }

      const hasPermission = await checkResponsePermission(
        userId,
        thread.boardId,
        "delete"
      );
      const passwordValid = await verifyThreadPassword(response.threadId, password);

      if (!hasPermission && !passwordValid) {
        throw new ResponseServiceError("Permission denied", "FORBIDDEN");
      }

      const result = await responseRepository.delete(id);

      // Invalidate cache
      invalidateCache(CACHE_TAGS.responses(response.threadId));
      invalidateCache(CACHE_TAGS.thread(response.threadId));

      return result;
    },
  };
}

export const responseService = createResponseService({
  responseRepository: defaultResponseRepository,
  threadRepository: defaultThreadRepository,
  boardRepository: defaultBoardRepository,
  permissionService: defaultPermissionService,
});
