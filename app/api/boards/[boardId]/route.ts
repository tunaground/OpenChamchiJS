import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { handleServiceError } from "@/lib/api/error-handler";
import { updateBoardSchema, configBoardSchema } from "@/lib/schemas";
import { validateOrigin } from "@/lib/api/csrf";

// GET /api/boards/[boardId] - 보드 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;

  try {
    const board = await boardService.findById(boardId);
    return NextResponse.json(board);
  } catch (error) {
    if (error instanceof BoardServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// PUT /api/boards/[boardId] - 보드 전체 수정 (board:edit)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const { boardId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateBoardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const board = await boardService.update(session.user.id, boardId, parsed.data);
    return NextResponse.json(board);
  } catch (error) {
    if (error instanceof BoardServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// PATCH /api/boards/[boardId] - 보드 설정만 수정 (board:config)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const { boardId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = configBoardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const board = await boardService.updateConfig(session.user.id, boardId, parsed.data);
    return NextResponse.json(board);
  } catch (error) {
    if (error instanceof BoardServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
