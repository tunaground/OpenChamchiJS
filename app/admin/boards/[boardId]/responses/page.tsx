import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { roleService } from "@/lib/services/role";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { responseService, SearchType } from "@/lib/services/response";
import { AdminResponseCursor } from "@/lib/repositories/interfaces/response";
import { getCountryCode } from "@/lib/ip";
import { toISOString } from "@/lib/cache";
import { AdminResponsesContent } from "./admin-responses-content";

interface Props {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{
    searchType?: string;
    search?: string;
    cursor?: string;
  }>;
}

export default async function AdminResponsesPage({ params, searchParams }: Props) {
  const { boardId } = await params;
  const { searchType, search, cursor: cursorParam } = await searchParams;
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;

  // Parse cursor from JSON string
  let cursor: AdminResponseCursor | null = null;
  if (cursorParam) {
    try {
      cursor = JSON.parse(cursorParam);
    } catch {
      // Invalid cursor, ignore
    }
  }

  const canManage = await roleService.canManageBoard(userId, boardId);
  if (!canManage) {
    redirect("/admin/boards");
  }
  const isAdmin = await roleService.isAdmin(userId);

  try {
    const board = await boardService.findById(boardId);
    const result = await responseService.findByBoardId(boardId, {
      searchType: searchType as SearchType | undefined,
      search,
      cursor,
      includeDeleted: true,
    });

    const t = await getTranslations("adminResponses");
    const tCommon = await getTranslations("common");
    const tSidebar = await getTranslations("adminSidebar");

    const responsesWithCountry = result.data.map((response) => ({
      id: response.id,
      threadId: response.threadId,
      threadTitle: response.thread?.title ?? "",
      seq: response.seq,
      username: response.username,
      authorId: response.authorId,
      userId: response.userId,
      userName: response.user?.name ?? null,
      userEmail: response.user?.email ?? null,
      ip: response.ip,
      country: getCountryCode(response.ip),
      content: response.content,
      visible: response.visible,
      deleted: response.deleted,
      createdAt: toISOString(response.createdAt),
    }));

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
          settings: tSidebar("settings"),
          globalNotices: tSidebar("globalNotices"),
          threads: tSidebar("threads"),
          responses: tSidebar("responses"),
          notices: tSidebar("notices"),
        }}
        isAdmin={isAdmin}
        responses={responsesWithCountry}
        hasMore={result.hasMore}
        nextCursor={result.nextCursor}
        scanned={result.scanned}
        searchType={searchType ?? ""}
        search={search ?? ""}
        canEdit={canManage}
        canDelete={canManage}
        labels={{
          title: t("title"),
          searchType: t("searchType"),
          searchByUsername: t("searchByUsername"),
          searchByAuthorId: t("searchByAuthorId"),
          searchByEmail: t("searchByEmail"),
          searchByContent: t("searchByContent"),
          searchByIp: t("searchByIp"),
          ip: t("ip"),
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
