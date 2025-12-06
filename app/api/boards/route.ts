import { NextRequest, NextResponse } from "next/server";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { handleServiceError } from "@/lib/api/error-handler";
import { requireAuth } from "@/lib/api/auth";
import { createBoardSchema } from "@/lib/schemas";
import { validateOrigin } from "@/lib/api/csrf";

// GET /api/boards - 보드 목록 조회
export async function GET() {
  const boards = await boardService.findAll();
  return NextResponse.json(boards);
}

// POST /api/boards - 보드 생성
export async function POST(request: NextRequest) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const auth = await requireAuth();
  if (!auth.authenticated) {
    return auth.response;
  }

  const body = await request.json();
  const parsed = createBoardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const board = await boardService.create(auth.user.id, parsed.data);
    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    if (error instanceof BoardServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
