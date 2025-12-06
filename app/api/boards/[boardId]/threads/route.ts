import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { threadService, ThreadServiceError } from "@/lib/services/thread";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { checkForeignIpBlocked } from "@/lib/api/foreign-ip-check";

const createThreadSchema = z.object({
  title: z.string().min(1).max(200),
  password: z.string().min(1).max(100),
  username: z.string().max(50).optional(),
});

function handleServiceError(error: ThreadServiceError) {
  const statusMap = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
  };
  return NextResponse.json(
    { error: error.message },
    { status: statusMap[error.code] }
  );
}

// GET /api/boards/[boardId]/threads - 스레드 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const threads = await threadService.findByBoardId(boardId, { page, limit });
    return NextResponse.json(threads);
  } catch (error) {
    if (error instanceof ThreadServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// POST /api/boards/[boardId]/threads - 스레드 생성 (누구나 가능)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;

  const body = await request.json();
  const parsed = createThreadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const board = await boardService.findById(boardId);

    // Check foreign IP block
    const foreignIpBlocked = await checkForeignIpBlocked(request, board);
    if (foreignIpBlocked) {
      return foreignIpBlocked;
    }

    const username = parsed.data.username?.trim() || board.defaultUsername;

    const thread = await threadService.create({
      boardId,
      title: parsed.data.title,
      password: parsed.data.password,
      username,
    });
    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    if (error instanceof ThreadServiceError) {
      return handleServiceError(error);
    }
    if (error instanceof BoardServiceError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
