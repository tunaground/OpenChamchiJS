import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { threadService } from "@/lib/services/thread";
import { noticeService } from "@/lib/services/notice";
import { isRealtimeEnabled } from "@/lib/realtime";
import { BoardIndexContent } from "./board-index-content";

interface Props {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function BoardIndexPage({ params, searchParams }: Props) {
  const { boardId } = await params;
  const { page: pageParam, search } = await searchParams;
  const page = parseInt(pageParam ?? "1", 10);

  try {
    const [board, allBoards, session] = await Promise.all([
      boardService.findById(boardId),
      boardService.findAll(),
      getServerSession(authOptions),
    ]);
    const [threadResult, notices] = await Promise.all([
      threadService.findByBoardId(boardId, { page, search }),
      noticeService.findPinnedAndRecent(boardId, 3),
    ]);

    const t = await getTranslations("boardIndex");
    const tCommon = await getTranslations("common");

    const canAccessAdmin = session
      ? await permissionService.checkUserPermission(session.user.id, "admin:read")
      : false;

    return (
      <BoardIndexContent
        boardId={boardId}
        boardName={board.name}
        boards={allBoards.map((b) => ({ id: b.id, name: b.name }))}
        realtimeEnabled={isRealtimeEnabled()}
        isLoggedIn={!!session}
        canAccessAdmin={canAccessAdmin}
        authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
        threads={threadResult.data.map((thread) => ({
          id: thread.id,
          title: thread.title,
          username: thread.username,
          ended: thread.ended,
          top: thread.top,
          responseCount: thread.responseCount,
          createdAt: thread.createdAt.toISOString(),
          updatedAt: thread.updatedAt.toISOString(),
        }))}
        pagination={threadResult.pagination}
        search={search ?? ""}
        notices={notices.map((notice) => ({
          id: notice.id,
          title: notice.title,
          pinned: notice.pinned,
          createdAt: notice.createdAt.toISOString(),
        }))}
        labels={{
          notices: t("notices"),
          moreNotices: t("moreNotices"),
          createThread: t("createThread"),
          id: t("id"),
          threadTitle: t("threadTitle"),
          author: t("author"),
          createdAt: t("createdAt"),
          updatedAt: t("updatedAt"),
          noThreads: t("noThreads"),
          noResults: t("noResults"),
          pinned: t("pinned"),
          ended: t("ended"),
          top: t("top"),
          searchPlaceholder: t("searchPlaceholder"),
          searchButton: t("searchButton"),
        }}
        boardsTitle={tCommon("boards")}
      />
    );
  } catch (error) {
    if (error instanceof BoardServiceError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
