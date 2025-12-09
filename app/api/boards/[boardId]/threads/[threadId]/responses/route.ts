import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { responseService, ResponseServiceError } from "@/lib/services/response";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { permissionService } from "@/lib/services/permission";
import { checkForeignIpBlocked, getClientIp } from "@/lib/api/foreign-ip-check";
import { handleServiceError } from "@/lib/api/error-handler";
import { preparse, preprocess, stringifyPreprocessed } from "@/lib/tom";
import { threadRepository } from "@/lib/repositories/prisma/thread";
import { userRepository } from "@/lib/repositories/prisma/user";
import { createResponseSchema } from "@/lib/schemas";
import { getPublisher, isRealtimeEnabled, CHANNELS, EVENTS } from "@/lib/realtime";
import { getStorage, isStorageEnabled, StorageError } from "@/lib/storage";

// GET /api/boards/[boardId]/threads/[threadId]/responses - 응답 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string }> }
) {
  const { boardId, threadId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const includeIp = searchParams.get("includeIp") === "true";
  const includeDeleted = searchParams.get("includeDeleted") === "true";
  const includeHidden = searchParams.get("includeHidden") === "true";
  const password = request.headers.get("X-Thread-Password");
  const startSeqParam = searchParams.get("startSeq");
  const endSeqParam = searchParams.get("endSeq");

  try {
    // Check if user has admin permission
    let isAdmin = false;
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const hasGlobalPermission = await permissionService.checkUserPermission(
        session.user.id,
        "response:delete"
      );
      const hasBoardPermission = await permissionService.checkUserPermission(
        session.user.id,
        `response:${boardId}:delete`
      );
      isAdmin = hasGlobalPermission || hasBoardPermission;
    }

    // Check password for includeHidden
    let passwordValid = false;
    if (includeHidden && password) {
      const thread = await threadRepository.findById(id);
      if (thread) {
        passwordValid = await bcrypt.compare(password, thread.password);
      }
    }

    // Determine what to include
    // - Admin can see everything with includeDeleted
    // - Password holder can see hidden (visible=false) but not deleted
    const canSeeHidden = isAdmin || passwordValid;

    // If user requested includeHidden but doesn't have permission, return error
    if (includeHidden && !canSeeHidden) {
      return NextResponse.json({ error: "Invalid password" }, { status: 403 });
    }

    // If startSeq and endSeq are provided, use range query
    let responses;
    if (startSeqParam !== null && endSeqParam !== null) {
      const startSeq = parseInt(startSeqParam, 10);
      const endSeq = parseInt(endSeqParam, 10);
      if (!isNaN(startSeq) && !isNaN(endSeq)) {
        responses = await responseService.findByRange(id, {
          type: "range",
          startSeq,
          endSeq,
        });
      } else {
        responses = await responseService.findByThreadId(id, {
          limit,
          offset,
          includeDeleted: includeDeleted && isAdmin,
          includeHidden: includeHidden && canSeeHidden,
        });
      }
    } else {
      responses = await responseService.findByThreadId(id, {
        limit,
        offset,
        includeDeleted: includeDeleted && isAdmin,
        includeHidden: includeHidden && canSeeHidden,
      });
    }

    // Strip sensitive fields from responses
    const sanitizedResponses = responses.map((response) => {
      if (includeIp && isAdmin) {
        // Admin with includeIp can see everything
        return response;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ip, userId, ...rest } = response;
      return rest;
    });

    return NextResponse.json(sanitizedResponses);
  } catch (error) {
    if (error instanceof ResponseServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

function generateAuthorId(ip: string): string {
  const today = new Date().toISOString().split("T")[0];
  const hash = crypto
    .createHash("sha256")
    .update(`${ip}:${today}`)
    .digest("hex")
    .slice(0, 8);
  return hash;
}

// POST /api/boards/[boardId]/threads/[threadId]/responses - 응답 생성 (누구나 가능)
// Accepts both JSON and FormData (for file upload)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string }> }
) {
  const { boardId, threadId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  // Parse request body - support both JSON and FormData
  let bodyData: { username?: string; content?: string; noup?: boolean; anonId?: string };
  let file: File | null = null;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const usernameValue = formData.get("username");
    const contentValue = formData.get("content");
    const anonIdValue = formData.get("anonId");
    bodyData = {
      username: typeof usernameValue === "string" ? usernameValue : undefined,
      content: typeof contentValue === "string" ? contentValue : undefined,
      noup: formData.get("noup") === "true",
      anonId: typeof anonIdValue === "string" ? anonIdValue : undefined,
    };
    file = formData.get("file") as File | null;
  } else {
    bodyData = await request.json();
  }

  const parsed = createResponseSchema.safeParse(bodyData);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ip = getClientIp(request);
  const authorId = generateAuthorId(ip);

  let uploadedKey: string | null = null;
  let attachmentUrl: string | null = null;

  try {
    const board = await boardService.findById(boardId);

    // Check foreign IP block
    const foreignIpBlocked = await checkForeignIpBlocked(request, board);
    if (foreignIpBlocked) {
      return foreignIpBlocked;
    }

    // Get userId from session if logged in
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Verify user exists if logged in (user might have been deleted)
    if (userId) {
      const user = await userRepository.findById(userId);
      if (!user) {
        return NextResponse.json(
          { error: "USER_NOT_FOUND" },
          { status: 401 }
        );
      }
    }

    // Handle file upload if present
    if (file && isStorageEnabled()) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const allowedMimeTypes = board.uploadMimeTypes
        .split(",")
        .map((t) => t.trim());

      const storage = getStorage();
      const result = await storage.upload(buffer, file.name, file.type, {
        maxSizeBytes: board.uploadMaxSize,
        allowedMimeTypes,
        folder: `boards/${boardId}`,
      });

      uploadedKey = result.key;
      attachmentUrl = result.url;
    }

    const username = parsed.data.username?.trim() || board.defaultUsername;

    // Preprocess TOM content (only processes dice at write time)
    const preparsedContent = preparse(parsed.data.content);
    const preprocessedContent = preprocess(preparsedContent);
    const content = stringifyPreprocessed(preprocessedContent);

    const response = await responseService.create({
      threadId: id,
      content,
      attachment: attachmentUrl ?? undefined,
      username,
      ip,
      authorId,
      userId,
      noup: parsed.data.noup,
    });

    // Publish to realtime channel for chat mode subscribers
    if (isRealtimeEnabled()) {
      try {
        const publisher = getPublisher();
        // Strip sensitive fields before publishing
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ip: _ip, userId: _userId, ...safeResponse } = response;
        await publisher.publish(
          CHANNELS.thread(id),
          EVENTS.NEW_RESPONSE,
          { ...safeResponse, anonId: parsed.data.anonId }
        );
      } catch (error) {
        // Log but don't fail the request if realtime publish fails
        console.error("Failed to publish realtime message:", error);
      }
    }

    // Strip sensitive fields before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ip: _ip2, userId: _userId2, ...safeResponseForClient } = response;
    return NextResponse.json(safeResponseForClient, { status: 201 });
  } catch (error) {
    // If response creation failed but image was uploaded, delete the image
    if (uploadedKey) {
      try {
        const storage = getStorage();
        await storage.delete(uploadedKey);
      } catch (deleteError) {
        console.error("Failed to delete uploaded image after error:", deleteError);
      }
    }

    if (error instanceof StorageError) {
      const statusMap: Record<string, number> = {
        FILE_TOO_LARGE: 413,
        INVALID_MIME_TYPE: 415,
        NOT_CONFIGURED: 503,
        UPLOAD_FAILED: 500,
      };
      return NextResponse.json(
        { error: error.message },
        { status: statusMap[error.code] || 500 }
      );
    }
    if (error instanceof ResponseServiceError) {
      return handleServiceError(error);
    }
    if (error instanceof BoardServiceError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
