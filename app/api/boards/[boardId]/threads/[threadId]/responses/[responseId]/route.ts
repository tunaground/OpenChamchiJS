import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { responseService, ResponseServiceError } from "@/lib/services/response";
import { handleServiceError } from "@/lib/api/error-handler";
import { updateResponseSchema, deleteResponseSchema } from "@/lib/schemas";

// GET /api/boards/[boardId]/threads/[threadId]/responses/[responseId] - 응답 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string; responseId: string }> }
) {
  const { responseId } = await params;

  try {
    const response = await responseService.findById(responseId);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// PUT /api/boards/[boardId]/threads/[threadId]/responses/[responseId] - 응답 수정 (권한 또는 비밀번호)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string; responseId: string }> }
) {
  const { responseId } = await params;

  const body = await request.json();
  const parsed = updateResponseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { password, ...updateData } = parsed.data;

  // Password authentication: only allows visible toggle
  if (password) {
    // Password can only change visible, not deleted or content
    if (updateData.deleted !== undefined || updateData.content !== undefined || updateData.attachment !== undefined) {
      return NextResponse.json(
        { error: "Password authentication only allows changing visibility" },
        { status: 400 }
      );
    }

    try {
      const response = await responseService.updateWithPassword(responseId, password, {
        visible: updateData.visible,
      });
      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof ResponseServiceError) {
        return handleServiceError(error);
      }
      throw error;
    }
  }

  // Admin authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await responseService.update(session.user.id, responseId, updateData);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// DELETE /api/boards/[boardId]/threads/[threadId]/responses/[responseId] - 응답 삭제 (권한 또는 비밀번호)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string; responseId: string }> }
) {
  const { responseId } = await params;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  let password: string | undefined;
  try {
    const body = await request.json();
    const parsed = deleteResponseSchema.safeParse(body);
    if (parsed.success) {
      password = parsed.data.password;
    }
  } catch {
    // body가 없는 경우 무시
  }

  try {
    const response = await responseService.delete(userId, responseId, password);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
