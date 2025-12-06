import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { threadService, ThreadServiceError } from "@/lib/services/thread";
import { permissionService } from "@/lib/services/permission";
import { handleServiceError } from "@/lib/api/error-handler";
import { updateThreadSchema } from "@/lib/schemas";

// GET /api/boards/[boardId]/threads/[threadId] - 스레드 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string }> }
) {
  const { boardId, threadId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
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

    const thread = await threadService.findById(id, {
      includeDeleted: includeDeleted && canViewDeleted,
    });
    return NextResponse.json(thread);
  } catch (error) {
    if (error instanceof ThreadServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// PUT /api/boards/[boardId]/threads/[threadId] - 스레드 수정 (권한 필요)
export async function PUT(
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
  const parsed = updateThreadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const thread = await threadService.update(session.user.id, id, parsed.data);
    return NextResponse.json(thread);
  } catch (error) {
    if (error instanceof ThreadServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// DELETE /api/boards/[boardId]/threads/[threadId] - 스레드 삭제 (권한 필요)
export async function DELETE(
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

  try {
    const thread = await threadService.delete(session.user.id, id);
    return NextResponse.json(thread);
  } catch (error) {
    if (error instanceof ThreadServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
