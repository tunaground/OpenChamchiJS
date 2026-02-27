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

// DELETE /api/boards/[boardId]/threads/[threadId]/bans/[banId] - 밴 삭제
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ boardId: string; threadId: string; banId: string }> }
) {
  const { threadId, banId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  // Auth: session (with permission) or thread password
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    try {
      const ban = await threadBanService.deleteBan(session.user.id, banId);
      return NextResponse.json(ban);
    } catch (error) {
      if (error instanceof ThreadBanServiceError && error.code === "FORBIDDEN") {
        // Permission denied, fall through to password check
      } else {
        if (error instanceof ThreadBanServiceError) {
          return handleServiceError(error);
        }
        throw error;
      }
    }
  }

  const passwordValid = await verifyThreadPassword(id, request);
  if (!passwordValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ban = await threadBanService.deleteBanDirect(banId);
    return NextResponse.json(ban);
  } catch (error) {
    if (error instanceof ThreadBanServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
