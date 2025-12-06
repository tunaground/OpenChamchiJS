import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { noticeService, NoticeServiceError } from "@/lib/services/notice";

const createNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  pinned: z.boolean().optional(),
});

function handleServiceError(error: NoticeServiceError) {
  const statusMap = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
  };
  return NextResponse.json(
    { error: error.message },
    { status: statusMap[error.code] }
  );
}

// GET /api/boards/[boardId]/notices - 공지사항 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;

  try {
    const notices = await noticeService.findByBoardId(boardId);
    return NextResponse.json(notices);
  } catch (error) {
    if (error instanceof NoticeServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

// POST /api/boards/[boardId]/notices - 공지사항 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createNoticeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const notice = await noticeService.create(session.user.id, {
      boardId,
      ...parsed.data,
    });
    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    if (error instanceof NoticeServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
