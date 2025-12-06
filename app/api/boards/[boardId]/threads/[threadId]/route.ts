import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { threadService, ThreadServiceError } from "@/lib/services/thread";

const updateThreadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  ended: z.boolean().optional(),
  top: z.boolean().optional(),
  password: z.string().optional(),
});

const deleteThreadSchema = z.object({
  password: z.string().optional(),
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

// GET /api/boards/[boardId]/threads/[threadId] - 스레드 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; threadId: string }> }
) {
  const { threadId } = await params;
  const id = parseInt(threadId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  try {
    const thread = await threadService.findById(id);
    return NextResponse.json(thread);
  } catch (error) {
    if (error instanceof ThreadServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// PUT /api/boards/[boardId]/threads/[threadId] - 스레드 수정
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
  const userId = session?.user?.id ?? null;

  const body = await request.json();
  const parsed = updateThreadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { password, ...updateData } = parsed.data;

  try {
    const thread = await threadService.update(userId, id, updateData, password);
    return NextResponse.json(thread);
  } catch (error) {
    if (error instanceof ThreadServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// DELETE /api/boards/[boardId]/threads/[threadId] - 스레드 삭제
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
  const userId = session?.user?.id ?? null;

  let password: string | undefined;
  try {
    const body = await request.json();
    const parsed = deleteThreadSchema.safeParse(body);
    if (parsed.success) {
      password = parsed.data.password;
    }
  } catch {
    // body가 없는 경우 무시
  }

  try {
    const thread = await threadService.delete(userId, id, password);
    return NextResponse.json(thread);
  } catch (error) {
    if (error instanceof ThreadServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
