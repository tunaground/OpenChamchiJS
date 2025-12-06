import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { noticeService, NoticeServiceError } from "@/lib/services/notice";
import { handleServiceError } from "@/lib/api/error-handler";
import { updateNoticeSchema } from "@/lib/schemas";

// GET /api/boards/[boardId]/notices/[noticeId] - 공지사항 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; noticeId: string }> }
) {
  const { noticeId } = await params;

  try {
    const notice = await noticeService.findById(parseInt(noticeId));
    return NextResponse.json(notice);
  } catch (error) {
    if (error instanceof NoticeServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// PUT /api/boards/[boardId]/notices/[noticeId] - 공지사항 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; noticeId: string }> }
) {
  const { noticeId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateNoticeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const notice = await noticeService.update(
      session.user.id,
      parseInt(noticeId),
      parsed.data
    );
    return NextResponse.json(notice);
  } catch (error) {
    if (error instanceof NoticeServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// DELETE /api/boards/[boardId]/notices/[noticeId] - 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; noticeId: string }> }
) {
  const { noticeId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notice = await noticeService.delete(session.user.id, parseInt(noticeId));
    return NextResponse.json(notice);
  } catch (error) {
    if (error instanceof NoticeServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
