import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { responseService, ResponseServiceError } from "@/lib/services/response";
import { roleService } from "@/lib/services/role";
import { handleServiceError } from "@/lib/api/error-handler";
import { updateResponseSchema, deleteResponseSchema } from "@/lib/schemas";

// GET /api/boards/[boardId]/threads/[threadId]/responses/[responseId] - 응답 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string; responseId: string }> }
) {
  const { boardId, responseId } = await params;

  const { searchParams } = new URL(request.url);
  const includeIp = searchParams.get("includeIp") === "true";

  try {
    const response = await responseService.findById(responseId, boardId);

    // Check if user has admin permission for the response's own board
    // (must use the response's own board, not the URL's boardId)
    let isAdmin = false;
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      isAdmin = await roleService.canManageBoard(session.user.id, response.boardId);
    }

    if (includeIp && isAdmin) {
      // Admin with includeIp can see everything
      return NextResponse.json(response);
    }

    // Strip sensitive fields for everyone else
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ip, userId, ...rest } = response;
    return NextResponse.json(rest);
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
      // Strip sensitive fields: write endpoints never need to return ip/userId
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ip, userId, ...rest } = response;
      return NextResponse.json(rest);
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
    // Strip sensitive fields: write endpoints never need to return ip/userId
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ip, userId, ...rest } = response;
    return NextResponse.json(rest);
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
    // Strip sensitive fields: write endpoints never need to return ip/userId
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ip, userId: responseUserId, ...rest } = response;
    return NextResponse.json(rest);
  } catch (error) {
    if (error instanceof ResponseServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
