import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { noticeService } from "@/lib/services/notice";
import { NoticeListContent } from "./notice-list-content";

interface Props {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function NoticeListPage({ params, searchParams }: Props) {
  const { boardId } = await params;
  const { page: pageParam, search } = await searchParams;
  const page = parseInt(pageParam ?? "1", 10);

  try {
    const board = await boardService.findById(boardId);
    const result = await noticeService.findByBoardId(boardId, { page, search });

    const t = await getTranslations("noticeList");

    return (
      <NoticeListContent
        boardId={boardId}
        boardName={board.name}
        notices={result.data.map((notice) => ({
          id: notice.id,
          title: notice.title,
          pinned: notice.pinned,
          createdAt: notice.createdAt.toISOString(),
          updatedAt: notice.updatedAt.toISOString(),
        }))}
        pagination={result.pagination}
        search={search ?? ""}
        labels={{
          title: t("title"),
          searchPlaceholder: t("searchPlaceholder"),
          searchButton: t("searchButton"),
          noNotices: t("noNotices"),
          noResults: t("noResults"),
          noticeTitle: t("noticeTitle"),
          pinned: t("pinned"),
          createdAt: t("createdAt"),
        }}
      />
    );
  } catch (error) {
    if (error instanceof BoardServiceError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
