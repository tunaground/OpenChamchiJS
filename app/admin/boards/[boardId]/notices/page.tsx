import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { roleService } from "@/lib/services/role";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { noticeService } from "@/lib/services/notice";
import { toISOString } from "@/lib/cache";
import { AdminNoticesContent } from "./admin-notices-content";

interface Props {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminNoticesPage({ params, searchParams }: Props) {
  const { boardId } = await params;
  const { page: pageParam, search } = await searchParams;
  const page = parseInt(pageParam ?? "1", 10);
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  const canManage = await roleService.canManageBoard(userId, boardId);
  if (!canManage) {
    redirect("/admin/boards");
  }
  const isAdmin = await roleService.isAdmin(userId);

  try {
    const board = await boardService.findById(boardId);
    const result = await noticeService.findByBoardId(boardId, { page, search });

    const t = await getTranslations("adminNotices");
    const tCommon = await getTranslations("common");
    const tSidebar = await getTranslations("adminSidebar");

    return (
      <AdminNoticesContent
        boardId={boardId}
        boardName={board.name}
        authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
        sidebarLabels={{
          backToHome: tSidebar("backToHome"),
          admin: tSidebar("admin"),
          boards: tSidebar("boards"),
          users: tSidebar("users"),
          settings: tSidebar("settings"),
          globalNotices: tSidebar("globalNotices"),
          threads: tSidebar("threads"),
          responses: tSidebar("responses"),
          notices: tSidebar("notices"),
        }}
        isAdmin={isAdmin}
        notices={result.data.map((notice) => ({
          id: notice.id,
          title: notice.title,
          content: notice.content,
          pinned: notice.pinned,
          createdAt: toISOString(notice.createdAt),
          updatedAt: toISOString(notice.updatedAt),
        }))}
        pagination={result.pagination}
        search={search ?? ""}
        canCreate={canManage}
        canUpdate={canManage}
        canDelete={canManage}
        labels={{
          title: t("title"),
          createNotice: t("createNotice"),
          noticeTitle: t("noticeTitle"),
          content: t("content"),
          pinned: t("pinned"),
          createdAt: t("createdAt"),
          actions: t("actions"),
          edit: t("edit"),
          delete: t("delete"),
          noNotices: t("noNotices"),
          noResults: t("noResults"),
          save: t("save"),
          cancel: t("cancel"),
          create: t("create"),
          createTitle: t("createTitle"),
          editTitle: t("editTitle"),
          confirmDelete: t("confirmDelete"),
          titlePlaceholder: t("titlePlaceholder"),
          contentPlaceholder: t("contentPlaceholder"),
          searchPlaceholder: t("searchPlaceholder"),
          searchButton: t("searchButton"),
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
