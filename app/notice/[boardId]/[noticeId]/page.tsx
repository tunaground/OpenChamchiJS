import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { noticeService, NoticeServiceError } from "@/lib/services/notice";
import { toISOString } from "@/lib/cache";
import { NoticeDetailContent } from "./notice-detail-content";

interface Props {
  params: Promise<{ boardId: string; noticeId: string }>;
}

export default async function NoticeDetailPage({ params }: Props) {
  const { boardId, noticeId } = await params;
  const noticeIdNum = parseInt(noticeId, 10);

  if (isNaN(noticeIdNum)) {
    notFound();
  }

  try {
    const board = await boardService.findById(boardId);
    const notice = await noticeService.findById(noticeIdNum);

    // Ensure notice belongs to this board
    if (notice.boardId !== boardId) {
      notFound();
    }

    const t = await getTranslations("noticeDetail");

    return (
      <NoticeDetailContent
        boardId={boardId}
        boardName={board.name}
        notice={{
          id: notice.id,
          title: notice.title,
          content: notice.content,
          pinned: notice.pinned,
          createdAt: toISOString(notice.createdAt),
          updatedAt: toISOString(notice.updatedAt),
        }}
        labels={{
          backToList: t("backToList"),
          pinned: t("pinned"),
          createdAt: t("createdAt"),
          updatedAt: t("updatedAt"),
        }}
      />
    );
  } catch (error) {
    if (
      (error instanceof BoardServiceError && error.code === "NOT_FOUND") ||
      (error instanceof NoticeServiceError && error.code === "NOT_FOUND")
    ) {
      notFound();
    }
    throw error;
  }
}
