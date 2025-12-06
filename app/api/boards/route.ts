import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { boardService, BoardServiceError } from "@/lib/services/board";

const createBoardSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  defaultUsername: z.string().min(1).max(50).default("noname"),
  maxResponsesPerThread: z.number().int().positive().optional(),
  blockForeignIp: z.boolean().optional(),
  responsesPerPage: z.number().int().positive().optional(),
  showUserCount: z.boolean().optional(),
  threadsPerPage: z.number().int().positive().optional(),
});

function handleServiceError(error: BoardServiceError) {
  const statusMap = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
  };
  return NextResponse.json(
    { error: error.message },
    { status: statusMap[error.code] }
  );
}

// GET /api/boards - 보드 목록 조회
export async function GET() {
  const boards = await boardService.findAll();
  return NextResponse.json(boards);
}

// POST /api/boards - 보드 생성
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createBoardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const board = await boardService.create(session.user.id, parsed.data);
    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    if (error instanceof BoardServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
