import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { noticeService } from "@/lib/services/notice";
import { permissionService } from "@/lib/services/permission";
import { globalSettingsService } from "@/lib/services/global-settings";
import { NoticeListContent } from "./notice-list-content";

interface Props {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { boardId } = await params;
  try {
    const [board, settings] = await Promise.all([
      boardService.findById(boardId),
      globalSettingsService.get(),
    ]);
    const t = await getTranslations("noticeList");
    return {
      title: `${settings.siteTitle} - ${board.name} ${t("title")}`,
    };
  } catch {
    return {};
  }
}

export default async function NoticeListPage({ params, searchParams }: Props) {
  const { boardId } = await params;
  const { page: pageParam, search } = await searchParams;
  const page = parseInt(pageParam ?? "1", 10);

  try {
    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session;
    const canAccessAdmin = session
      ? await permissionService.checkUserPermission(session.user.id, "admin:read")
      : false;

    const [board, allBoards, settings, result] = await Promise.all([
      boardService.findById(boardId),
      boardService.findAll(),
      globalSettingsService.get(),
      noticeService.findByBoardId(boardId, { page, search }),
    ]);
    const boards = allBoards.filter((b) => !b.deleted);

    const t = await getTranslations("noticeList");
    const tCommon = await getTranslations("common");

    return (
      <NoticeListContent
        boardId={boardId}
        boardName={board.name}
        boards={boards.map((b) => ({ id: b.id, name: b.name }))}
        customLinks={settings.customLinks}
        isLoggedIn={isLoggedIn}
        canAccessAdmin={canAccessAdmin}
        authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
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
        boardsTitle={tCommon("boards")}
        manualLabel={tCommon("manual")}
      />
    );
  } catch (error) {
    if (error instanceof BoardServiceError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
