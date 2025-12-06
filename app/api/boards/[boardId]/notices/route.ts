import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { noticeService, NoticeServiceError } from "@/lib/services/notice";
import { handleServiceError } from "@/lib/api/error-handler";
import { parsePaginationQuery } from "@/lib/types/pagination";
import { createNoticeSchema } from "@/lib/schemas";

// GET /api/boards/[boardId]/notices - 공지사항 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;
  const { searchParams } = new URL(request.url);
  const { page, limit, search } = parsePaginationQuery(searchParams, { limit: 20 });

  try {
    const result = await noticeService.findByBoardId(boardId, { page, limit, search });
    return NextResponse.json(result);
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
