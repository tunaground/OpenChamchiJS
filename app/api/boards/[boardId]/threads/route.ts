import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { threadService, ThreadServiceError } from "@/lib/services/thread";

const createThreadSchema = z.object({
  title: z.string().min(1).max(200),
  password: z.string().min(1).max(100),
  username: z.string().min(1).max(50),
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
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    const threads = await threadService.findByBoardId(boardId, { limit, offset });
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
    const thread = await threadService.create({
      boardId,
      ...parsed.data,
    });
    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    if (error instanceof ThreadServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
