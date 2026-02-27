import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import {
  threadBanService,
  ThreadBanServiceError,
} from "@/lib/services/thread-ban";
import { threadRepository } from "@/lib/repositories/prisma/thread";
import { handleServiceError } from "@/lib/api/error-handler";

async function verifyThreadPassword(
  threadId: number,
  request: NextRequest
): Promise<boolean> {
  const rawPassword = request.headers.get("X-Thread-Password");
  if (!rawPassword) return false;
  const password = decodeURIComponent(atob(rawPassword));
  const thread = await threadRepository.findById(threadId);
  if (!thread) return false;
  return bcrypt.compare(password, thread.password);
}

// GET /api/boards/[boardId]/threads/[threadId]/bans - 밴 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string }> }
) {
  const { threadId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  // Auth: session (with permission) or thread password
  const session = await getServerSession(authOptions);
  let authorized = false;

  if (session?.user?.id) {
    try {
      await threadBanService.findByThreadId(session.user.id, id);
      authorized = true;
    } catch {
      // Permission denied, fall through to password check
    }
  }

  if (!authorized) {
    const passwordValid = await verifyThreadPassword(id, request);
    if (!passwordValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const bans = await threadBanService.findByThreadIdDirect(id);
    return NextResponse.json(bans);
  } catch (error) {
    if (error instanceof ThreadBanServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// POST /api/boards/[boardId]/threads/[threadId]/bans - 밴 생성 (벌크)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string }> }
) {
  const { threadId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  // Auth: session (with permission) or thread password
  const session = await getServerSession(authOptions);
  let authorized = false;

  if (session?.user?.id) {
    try {
      // Check permission via service (will throw if no permission)
      const thread = await threadRepository.findById(id);
      if (thread) {
        const { permissionService } = await import("@/lib/services/permission");
        authorized = await permissionService.checkUserPermissions(session.user.id, [
          "response:delete",
          `response:${thread.boardId}:delete`,
        ]);
      }
    } catch {
      // Permission denied, fall through to password check
    }
  }

  if (!authorized) {
    const passwordValid = await verifyThreadPassword(id, request);
    if (!passwordValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await request.json();
  const { authorIds } = body;

  if (!Array.isArray(authorIds) || authorIds.length === 0) {
    return NextResponse.json(
      { error: "authorIds must be a non-empty array" },
      { status: 400 }
    );
  }

  try {
    const bans = await threadBanService.createBansDirect(id, authorIds);
    return NextResponse.json(bans, { status: 201 });
  } catch (error) {
    if (error instanceof ThreadBanServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
