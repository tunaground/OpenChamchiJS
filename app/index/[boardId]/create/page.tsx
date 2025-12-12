import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { boardService } from "@/lib/services/board";
import { BoardServiceError } from "@/lib/services/board";
import { permissionService } from "@/lib/services/permission";
import { globalSettingsService } from "@/lib/services/global-settings";
import { isStorageEnabled } from "@/lib/storage";
import { CreateThreadContent } from "./create-thread-content";

interface Props {
  params: Promise<{ boardId: string }>;
}

export default async function CreateThreadPage({ params }: Props) {
  const { boardId } = await params;

  try {
    const [board, boards, session, settings] = await Promise.all([
      boardService.findById(boardId),
      boardService.findAll(),
      getServerSession(authOptions),
      globalSettingsService.get(),
    ]);
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
        tripcodeSalt={settings.tripcodeSalt || undefined}
        boards={boards.map((b) => ({ id: b.id, name: b.name }))}
        storageEnabled={isStorageEnabled()}
        uploadMaxSize={board.uploadMaxSize}
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
          selectImage: t("selectImage"),
          removeImage: t("removeImage"),
          submit: t("submit"),
          cancel: t("cancel"),
          creating: t("creating"),
          foreignIpBlocked: t("foreignIpBlocked"),
          unknownError: t("unknownError"),
          aaMode: t("aaMode"),
          previewMode: t("previewMode"),
          preview: t("preview"),
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
