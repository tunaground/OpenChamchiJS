import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { threadService, ThreadServiceError } from "@/lib/services/thread";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { permissionService } from "@/lib/services/permission";
import { checkForeignIpBlocked } from "@/lib/api/foreign-ip-check";
import { handleServiceError } from "@/lib/api/error-handler";
import { parsePaginationQuery } from "@/lib/types/pagination";
import { createThreadSchema } from "@/lib/schemas";
import { userRepository } from "@/lib/repositories/prisma/user";

// GET /api/boards/[boardId]/threads - 스레드 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const { searchParams } = new URL(request.url);
  const { page, limit, search } = parsePaginationQuery(searchParams, { limit: 20 });
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  try {
    // Check if user has admin permission for includeDeleted
    let canViewDeleted = false;
    if (includeDeleted) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const hasGlobalPermission = await permissionService.checkUserPermission(
          session.user.id,
          "thread:delete"
        );
        const hasBoardPermission = await permissionService.checkUserPermission(
          session.user.id,
          `thread:${boardId}:delete`
        );
        canViewDeleted = hasGlobalPermission || hasBoardPermission;
      }
    }

    const threads = await threadService.findByBoardId(boardId, {
      page,
      limit,
      search,
      includeDeleted: includeDeleted && canViewDeleted,
    });
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

    // Get userId from session if logged in
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Verify user exists if logged in (user might have been deleted)
    if (userId) {
      const user = await userRepository.findById(userId);
      if (!user) {
        return NextResponse.json(
          { error: "USER_NOT_FOUND" },
          { status: 401 }
        );
      }
    }

    const username = parsed.data.username?.trim() || board.defaultUsername;

    const thread = await threadService.create({
      boardId,
      title: parsed.data.title,
      password: parsed.data.password,
      username,
      userId,
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
