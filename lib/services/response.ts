import bcrypt from "bcryptjs";
import {
  permissionService as defaultPermissionService,
  PermissionService,
} from "@/lib/services/permission";
import { responseRepository as defaultResponseRepository } from "@/lib/repositories/prisma/response";
import { threadRepository as defaultThreadRepository } from "@/lib/repositories/prisma/thread";
import {
  ResponseRepository,
  ResponseData,
  CreateResponseInput,
  UpdateResponseInput,
} from "@/lib/repositories/interfaces/response";
import { ThreadRepository } from "@/lib/repositories/interfaces/thread";

export class ResponseServiceError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST"
  ) {
    super(message);
    this.name = "ResponseServiceError";
  }
}

export interface ResponseService {
  findByThreadId(
    threadId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<ResponseData[]>;
  findById(id: string): Promise<ResponseData>;
  create(data: CreateResponseInput): Promise<ResponseData>;
  update(
    userId: string,
    id: string,
    data: UpdateResponseInput
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
  permissionService: PermissionService;
}

export function createResponseService(deps: ResponseServiceDeps): ResponseService {
  const { responseRepository, threadRepository, permissionService } = deps;

  async function checkResponsePermission(
    userId: string | null,
    boardId: string,
    action: "update" | "delete"
  ): Promise<boolean> {
    if (!userId) return false;

    const permissions = [
      `response:${action}`,
      `response:${boardId}:${action}`,
    ];

    for (const permission of permissions) {
      if (await permissionService.checkUserPermission(userId, permission)) {
        return true;
      }
    }
    return false;
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
      options?: { limit?: number; offset?: number }
    ): Promise<ResponseData[]> {
      const thread = await threadRepository.findById(threadId);
      if (!thread || thread.deleted) {
        throw new ResponseServiceError("Thread not found", "NOT_FOUND");
      }

      return responseRepository.findByThreadId(threadId, options);
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

      const response = await responseRepository.create(data);

      // 새 응답 추가 시 스레드 범프
      await threadRepository.updateBumpTime(data.threadId);

      return response;
    },

    async update(
      userId: string,
      id: string,
      data: UpdateResponseInput
    ): Promise<ResponseData> {
      const response = await responseRepository.findById(id);
      if (!response || response.deleted) {
        throw new ResponseServiceError("Response not found", "NOT_FOUND");
      }

      const thread = await threadRepository.findById(response.threadId);
      if (!thread) {
        throw new ResponseServiceError("Thread not found", "NOT_FOUND");
      }

      const hasPermission = await checkResponsePermission(userId, thread.boardId, "update");
      if (!hasPermission) {
        throw new ResponseServiceError("Permission denied", "FORBIDDEN");
      }

      return responseRepository.update(id, data);
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

      return responseRepository.delete(id);
    },
  };
}

export const responseService = createResponseService({
  responseRepository: defaultResponseRepository,
  threadRepository: defaultThreadRepository,
  permissionService: defaultPermissionService,
});
