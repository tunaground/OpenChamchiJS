import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { boardService } from "@/lib/services/board";
import { threadService, ThreadServiceError } from "@/lib/services/thread";
import { responseService } from "@/lib/services/response";
import { responseRepository } from "@/lib/repositories/prisma/response";
import { globalSettingsService } from "@/lib/services/global-settings";
import { parseRangeParam } from "@/lib/types/response-range";
import { isRealtimeEnabled } from "@/lib/realtime";
import { isStorageEnabled } from "@/lib/storage";
import { ThreadDetailContent } from "./thread-detail-content";

const ARCHIVE_REDIRECT_ENABLED = process.env.ARCHIVE_REDIRECT_ENABLED === "true";

async function checkArchiveExists(boardId: string, threadId: number): Promise<boolean> {
  if (!ARCHIVE_REDIRECT_ENABLED) return false;
  try {
    const res = await fetch(
      `https://archive-data.tunaground.net/data/${boardId}/${threadId}.json`,
      { method: "HEAD" }
    );
    return res.ok;
  } catch {
    return false;
  }
}

interface Props {
  params: Promise<{ boardId: string; threadId: string; range?: string[] }>;
}

export default async function ThreadDetailPage({ params }: Props) {
  const { boardId, threadId, range: rangeParam } = await params;
  const threadIdNum = parseInt(threadId, 10);

  if (isNaN(threadIdNum)) {
    notFound();
  }

  try {
    const [thread, allBoards, session, settings] = await Promise.all([
      threadService.findById(threadIdNum),
      boardService.findAll(),
      getServerSession(authOptions),
      globalSettingsService.get(),
    ]);

    // Verify boardId matches
    if (thread.boardId !== boardId) {
      notFound();
    }

    const board = await boardService.findById(thread.boardId);

    // Parse range parameter
    const parsedRange = parseRangeParam(rangeParam, board.responsesPerPage);
    if (!parsedRange.valid) {
      notFound();
    }

    const [responses, responseCount] = await Promise.all([
      responseService.findByRange(threadIdNum, parsedRange.range),
      responseRepository.countByThreadId(threadIdNum),
    ]);

    // lastSeq is count - 1 (since seq starts from 0)
    const lastSeq = Math.max(0, responseCount - 1);

    const t = await getTranslations("threadDetail");
    const tCommon = await getTranslations("common");
    const tSidebar = await getTranslations("traceSidebar");

    const canAccessAdmin = session
      ? await permissionService.checkUserPermission(session.user.id, "admin:read")
      : false;

    // Check if user can manage responses (global or board-specific permission)
    let canManageResponses = false;
    if (session?.user?.id) {
      const hasGlobalPermission = await permissionService.checkUserPermission(
        session.user.id,
        "response:delete"
      );
      const hasBoardPermission = await permissionService.checkUserPermission(
        session.user.id,
        `response:${boardId}:delete`
      );
      canManageResponses = hasGlobalPermission || hasBoardPermission;
    }

    // Determine current view type for navigation
    // Format: "all", "recent", "5" (single), or "5/10" (range)
    const currentView = !rangeParam || rangeParam.length === 0
      ? "all"
      : rangeParam.length === 1
        ? rangeParam[0]
        : `${rangeParam[0]}/${rangeParam[1]}`;

    return (
      <ThreadDetailContent
        thread={{
          id: thread.id,
          boardId: thread.boardId,
          title: thread.title,
          username: thread.username,
          ended: thread.ended,
          top: thread.top,
          createdAt: thread.createdAt.toISOString(),
          updatedAt: thread.updatedAt.toISOString(),
        }}
        boards={allBoards.map((b) => ({ id: b.id, name: b.name }))}
        defaultUsername={board.defaultUsername}
        tripcodeSalt={settings.tripcodeSalt || undefined}
        showUserCount={board.showUserCount && isRealtimeEnabled()}
        realtimeEnabled={isRealtimeEnabled()}
        storageEnabled={isStorageEnabled()}
        uploadMaxSize={board.uploadMaxSize}
        isLoggedIn={!!session}
        canAccessAdmin={canAccessAdmin}
        canManageResponses={canManageResponses}
        authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
        responses={responses.map((response) => ({
          id: response.id,
          seq: response.seq,
          username: response.username,
          authorId: response.authorId,
          content: response.content,
          attachment: response.attachment,
          createdAt: response.createdAt.toISOString(),
        }))}
        currentView={currentView}
        lastSeq={lastSeq}
        responsesPerPage={board.responsesPerPage}
        labels={{
          backToList: t("backToList"),
          author: t("author"),
          createdAt: t("createdAt"),
          updatedAt: t("updatedAt"),
          ended: t("ended"),
          top: t("top"),
          noResponses: t("noResponses"),
          usernamePlaceholder: t("usernamePlaceholder"),
          contentPlaceholder: t("contentPlaceholder"),
          submit: t("submit"),
          submitting: t("submitting"),
          threadEnded: t("threadEnded"),
          deleteResponse: t("deleteResponse"),
          deleteModalTitle: t("deleteModalTitle"),
          deleteModalDescription: t("deleteModalDescription"),
          passwordPlaceholder: t("passwordPlaceholder"),
          cancel: t("cancel"),
          confirm: t("confirm"),
          invalidPassword: t("invalidPassword"),
          manageResponses: t("manageResponses"),
          manageModalTitle: t("manageModalTitle"),
          manageModalDescription: t("manageModalDescription"),
          seq: t("seq"),
          content: t("content"),
          status: t("status"),
          actions: t("actions"),
          visible: t("visible"),
          hidden: t("hidden"),
          restore: t("restore"),
          hide: t("hide"),
          noHiddenResponses: t("noHiddenResponses"),
          close: t("close"),
          unlock: t("unlock"),
          foreignIpBlocked: t("foreignIpBlocked"),
          unknownError: t("unknownError"),
          selectImage: t("selectImage"),
          removeImage: t("removeImage"),
          viewSource: t("viewSource"),
          copied: t("copied"),
          loadMore: t("loadMore"),
          loadingMore: t("loadingMore"),
        }}
        sidebarLabels={{
          navigation: tSidebar("navigation"),
          backToBoard: tSidebar("backToBoard"),
          manageThread: tSidebar("manageThread"),
          viewAll: tSidebar("viewAll"),
          viewRecent: tSidebar("viewRecent"),
          prev: tSidebar("prev"),
          next: tSidebar("next"),
          scrollUp: tSidebar("scrollUp"),
          scrollDown: tSidebar("scrollDown"),
          boards: tSidebar("boards"),
        }}
        customLinks={settings.customLinks}
      />
    );
  } catch (error) {
    if (error instanceof ThreadServiceError && error.code === "NOT_FOUND") {
      // Check if archive exists and redirect if enabled
      const archiveExists = await checkArchiveExists(boardId, threadIdNum);
      if (archiveExists) {
        const slug = rangeParam?.join("/") || "";
        redirect(`/archive/${boardId}/${threadIdNum}${slug ? "/" + slug : ""}`);
      }
      notFound();
    }
    throw error;
  }
}
