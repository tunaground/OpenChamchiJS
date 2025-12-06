import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { boardService } from "@/lib/services/board";
import { BoardServiceError } from "@/lib/services/board";
import { permissionService } from "@/lib/services/permission";
import { CreateThreadContent } from "./create-thread-content";

interface Props {
  params: Promise<{ boardId: string }>;
}

export default async function CreateThreadPage({ params }: Props) {
  const { boardId } = await params;

  try {
    const board = await boardService.findById(boardId);
    const boards = await boardService.findAll();
    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session;
    const canAccessAdmin = session
      ? await permissionService.checkUserPermission(session.user.id, "admin:read")
      : false;

    const t = await getTranslations("createThread");
    const tCommon = await getTranslations("common");

    return (
      <CreateThreadContent
        boardId={boardId}
        boardName={board.name}
        defaultUsername={board.defaultUsername}
        boards={boards.map((b) => ({ id: b.id, name: b.name }))}
        isLoggedIn={isLoggedIn}
        canAccessAdmin={canAccessAdmin}
        authLabels={{
          login: tCommon("login"),
          logout: tCommon("logout"),
        }}
        labels={{
          title: t("title"),
          threadTitle: t("threadTitle"),
          threadTitlePlaceholder: t("threadTitlePlaceholder"),
          username: t("username"),
          usernamePlaceholder: t("usernamePlaceholder"),
          password: t("password"),
          passwordPlaceholder: t("passwordPlaceholder"),
          content: t("content"),
          contentPlaceholder: t("contentPlaceholder"),
          attachment: t("attachment"),
          attachmentPlaceholder: t("attachmentPlaceholder"),
          submit: t("submit"),
          cancel: t("cancel"),
          creating: t("creating"),
          foreignIpBlocked: t("foreignIpBlocked"),
          unknownError: t("unknownError"),
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
