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
import { parse, preprocess, stringifyPreprocessed } from "@/lib/tom";
import { threadRepository } from "@/lib/repositories/prisma/thread";
import { createResponseSchema } from "@/lib/schemas";

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

    // Strip IP from responses if user doesn't have permission
    const sanitizedResponses = responses.map((response) => {
      if (includeIp && isAdmin) {
        return response;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ip, ...rest } = response;
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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string }> }
) {
  const { boardId, threadId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createResponseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ip = getClientIp(request);
  const authorId = generateAuthorId(ip);

  try {
    const board = await boardService.findById(boardId);

    // Check foreign IP block
    const foreignIpBlocked = await checkForeignIpBlocked(request, board);
    if (foreignIpBlocked) {
      return foreignIpBlocked;
    }

    const username = parsed.data.username?.trim() || board.defaultUsername;

    // Preprocess TOM content (only processes dice at write time)
    const parsedContent = parse(parsed.data.content);
    const preprocessedContent = preprocess(parsedContent);
    const content = stringifyPreprocessed(preprocessedContent);

    const response = await responseService.create({
      threadId: id,
      content,
      attachment: parsed.data.attachment,
      username,
      ip,
      authorId,
      noup: parsed.data.noup,
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ResponseServiceError) {
      return handleServiceError(error);
    }
    if (error instanceof BoardServiceError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
