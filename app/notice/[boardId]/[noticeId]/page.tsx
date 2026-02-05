import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { boardService, BoardServiceError } from "@/lib/services/board";
import { noticeService, NoticeServiceError } from "@/lib/services/notice";
import { permissionService } from "@/lib/services/permission";
import { globalSettingsService } from "@/lib/services/global-settings";
import { toISOString } from "@/lib/cache";
import { NoticeDetailContent } from "./notice-detail-content";

interface Props {
  params: Promise<{ boardId: string; noticeId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { noticeId } = await params;
  const noticeIdNum = parseInt(noticeId, 10);
  if (isNaN(noticeIdNum)) {
    return {};
  }
  try {
    const [notice, settings] = await Promise.all([
      noticeService.findById(noticeIdNum),
      globalSettingsService.get(),
    ]);
    return {
      title: `${settings.siteTitle} - ${notice.title}`,
    };
  } catch {
    return {};
  }
}

export default async function NoticeDetailPage({ params }: Props) {
  const { boardId, noticeId } = await params;
  const noticeIdNum = parseInt(noticeId, 10);

  if (isNaN(noticeIdNum)) {
    notFound();
  }

  try {
    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session;
    const canAccessAdmin = session
      ? await permissionService.checkUserPermission(session.user.id, "admin:read")
      : false;

    const [board, allBoards, notice, settings] = await Promise.all([
      boardService.findById(boardId),
      boardService.findAll(),
      noticeService.findById(noticeIdNum),
      globalSettingsService.get(),
    ]);

    // Ensure notice belongs to this board
    if (notice.boardId !== boardId) {
      notFound();
    }

    const boards = allBoards.filter((b) => !b.deleted);

    const t = await getTranslations("noticeDetail");
    const tCommon = await getTranslations("common");

    return (
      <NoticeDetailContent
        boardId={boardId}
        boardName={board.name}
        boards={boards.map((b) => ({ id: b.id, name: b.name }))}
        customLinks={settings.customLinks}
        isLoggedIn={isLoggedIn}
        canAccessAdmin={canAccessAdmin}
        authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
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
        boardsTitle={tCommon("boards")}
        manualLabel={tCommon("manual")}
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
