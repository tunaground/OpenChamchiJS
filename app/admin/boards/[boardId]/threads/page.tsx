import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { roleService } from "@/lib/services/role";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { threadService } from "@/lib/services/thread";
import { toISOString } from "@/lib/cache";
import { AdminThreadsContent } from "./admin-threads-content";

interface Props {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminThreadsPage({ params, searchParams }: Props) {
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
    const result = await threadService.findByBoardId(boardId, { page, search, includeDeleted: true });

    const t = await getTranslations("adminThreads");
    const tCommon = await getTranslations("common");
    const tSidebar = await getTranslations("adminSidebar");

    return (
      <AdminThreadsContent
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
        threads={result.data.map((thread) => ({
          id: thread.id,
          title: thread.title,
          username: thread.username,
          ended: thread.ended,
          top: thread.top,
          deleted: thread.deleted,
          createdAt: toISOString(thread.createdAt),
          updatedAt: toISOString(thread.updatedAt),
        }))}
        pagination={result.pagination}
        search={search ?? ""}
        canEdit={canManage}
        canDelete={canManage}
        labels={{
          title: t("title"),
          threadTitle: t("threadTitle"),
          author: t("author"),
          responses: t("responses"),
          status: t("status"),
          createdAt: t("createdAt"),
          updatedAt: t("updatedAt"),
          actions: t("actions"),
          ended: t("ended"),
          top: t("top"),
          active: t("active"),
          edit: t("edit"),
          delete: t("delete"),
          view: t("view"),
          noThreads: t("noThreads"),
          noResults: t("noResults"),
          confirmDelete: t("confirmDelete"),
          editTitle: t("editTitle"),
          save: t("save"),
          cancel: t("cancel"),
          searchPlaceholder: t("searchPlaceholder"),
          searchButton: t("searchButton"),
          setTop: t("setTop"),
          unsetTop: t("unsetTop"),
          setEnded: t("setEnded"),
          unsetEnded: t("unsetEnded"),
          manageResponses: t("manageResponses"),
          responsesTitle: t("responsesTitle"),
          seq: t("seq"),
          content: t("content"),
          noResponses: t("noResponses"),
          confirmDeleteResponse: t("confirmDeleteResponse"),
          close: t("close"),
          visible: t("visible"),
          hidden: t("hidden"),
          deleted: t("deleted"),
          hide: t("hide"),
          show: t("show"),
          restore: t("restore"),
          confirmRestore: t("confirmRestore"),
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
