import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  threadBanService,
  ThreadBanServiceError,
} from "@/lib/services/thread-ban";
import { handleServiceError } from "@/lib/api/error-handler";

// GET /api/boards/[boardId]/threads/[threadId]/bans - 밴 목록 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string }> }
) {
  const { threadId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bans = await threadBanService.findByThreadId(session.user.id, id);
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

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const bans = await threadBanService.createBans(
      session.user.id,
      id,
      authorIds
    );
    return NextResponse.json(bans, { status: 201 });
  } catch (error) {
    if (error instanceof ThreadBanServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
