import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { responseService, ResponseServiceError } from "@/lib/services/response";

const updateResponseSchema = z.object({
  content: z.string().min(1).optional(),
  attachment: z.string().optional(),
  visible: z.boolean().optional(),
  password: z.string().optional(),
});

const deleteResponseSchema = z.object({
  password: z.string().optional(),
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

// PUT /api/boards/[boardId]/threads/[threadId]/responses/[responseId] - 응답 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string; responseId: string }> }
) {
  const { responseId } = await params;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const body = await request.json();
  const parsed = updateResponseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { password, ...updateData } = parsed.data;

  try {
    const response = await responseService.update(userId, responseId, updateData, password);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResponseServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// DELETE /api/boards/[boardId]/threads/[threadId]/responses/[responseId] - 응답 삭제
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
