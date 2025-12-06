import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { responseService, ResponseServiceError } from "@/lib/services/response";

const createResponseSchema = z.object({
  username: z.string().min(1).max(50),
  authorId: z.string().min(1),
  userId: z.string().optional(),
  ip: z.string().min(1),
  content: z.string().min(1),
  attachment: z.string().optional(),
});

function handleServiceError(error: ResponseServiceError) {
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

// GET /api/boards/[boardId]/threads/[threadId]/responses - 응답 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string }> }
) {
  const { threadId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    const responses = await responseService.findByThreadId(id, { limit, offset });
    return NextResponse.json(responses);
  } catch (error) {
    if (error instanceof ResponseServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// POST /api/boards/[boardId]/threads/[threadId]/responses - 응답 생성 (누구나 가능)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string }> }
) {
  const { threadId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createResponseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const response = await responseService.create({
      threadId: id,
      ...parsed.data,
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ResponseServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
