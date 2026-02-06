import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { responseService, SearchType } from "@/lib/services/response";
import { ContentSearchCursor } from "@/lib/repositories/interfaces/response";
import { AdminResponsesContent } from "./admin-responses-content";

interface Props {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{
    page?: string;
    searchType?: string;
    search?: string;
    cursor?: string;
  }>;
}

export default async function AdminResponsesPage({ params, searchParams }: Props) {
  const { boardId } = await params;
  const { page: pageParam, searchType, search, cursor: cursorParam } = await searchParams;
  const page = parseInt(pageParam ?? "1", 10);
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  // Parse cursor from JSON string
  let cursor: ContentSearchCursor | null = null;
  if (cursorParam) {
    try {
      cursor = JSON.parse(cursorParam);
    } catch {
      // Invalid cursor, ignore
    }
  }

  // Check permissions (same as thread permissions)
  const canEditGlobal = await permissionService.checkUserPermission(userId, "response:update");
  const canEditBoard = await permissionService.checkUserPermission(userId, `response:${boardId}:update`);
  const canEdit = canEditGlobal || canEditBoard;

  const canDeleteGlobal = await permissionService.checkUserPermission(userId, "response:delete");
  const canDeleteBoard = await permissionService.checkUserPermission(userId, `response:${boardId}:delete`);
  const canDelete = canDeleteGlobal || canDeleteBoard;

  try {
    const board = await boardService.findById(boardId);
    const result = await responseService.findByBoardId(boardId, {
      page,
      searchType: searchType as SearchType | undefined,
      search,
      cursor,
      includeDeleted: true,
    });

    const t = await getTranslations("adminResponses");
    const tCommon = await getTranslations("common");
    const tSidebar = await getTranslations("adminSidebar");

    return (
      <AdminResponsesContent
        boardId={boardId}
        boardName={board.name}
        authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
        sidebarLabels={{
          backToHome: tSidebar("backToHome"),
          admin: tSidebar("admin"),
          boards: tSidebar("boards"),
          users: tSidebar("users"),
          roles: tSidebar("roles"),
          settings: tSidebar("settings"),
          threads: tSidebar("threads"),
          responses: tSidebar("responses"),
          notices: tSidebar("notices"),
        }}
        responses={result.data.map((response) => ({
          id: response.id,
          threadId: response.threadId,
          threadTitle: response.thread?.title ?? "",
          seq: response.seq,
          username: response.username,
          authorId: response.authorId,
          userId: response.userId,
          userName: response.user?.name ?? null,
          userEmail: response.user?.email ?? null,
          content: response.content,
          visible: response.visible,
          deleted: response.deleted,
          createdAt: response.createdAt.toISOString(),
        }))}
        pagination={result.pagination}
        cursor={result.cursor}
        searchType={searchType ?? ""}
        search={search ?? ""}
        canEdit={canEdit}
        canDelete={canDelete}
        labels={{
          title: t("title"),
          searchType: t("searchType"),
          searchByUsername: t("searchByUsername"),
          searchByAuthorId: t("searchByAuthorId"),
          searchByEmail: t("searchByEmail"),
          searchByContent: t("searchByContent"),
          searchPlaceholder: t("searchPlaceholder"),
          searchButton: t("searchButton"),
          thread: t("thread"),
          seq: t("seq"),
          username: t("username"),
          authorId: t("authorId"),
          user: t("user"),
          anonymous: t("anonymous"),
          content: t("content"),
          createdAt: t("createdAt"),
          status: t("status"),
          actions: t("actions"),
          visible: t("visible"),
          hidden: t("hidden"),
          deleted: t("deleted"),
          hide: t("hide"),
          show: t("show"),
          delete: t("delete"),
          restore: t("restore"),
          noResponses: t("noResponses"),
          noResults: t("noResults"),
          loadMore: t("loadMore"),
          loading: t("loading"),
          scannedCount: t("scannedCount"),
          resultCount: t("resultCount"),
          searchComplete: t("searchComplete"),
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
