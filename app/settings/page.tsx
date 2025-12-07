import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { boardService } from "@/lib/services/board";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  const [session, allBoards, t, tCommon] = await Promise.all([
    getServerSession(authOptions),
    boardService.findAll(),
    getTranslations("settings"),
    getTranslations("common"),
  ]);

  const canAccessAdmin = session
    ? await permissionService.checkUserPermission(session.user.id, "admin:read")
    : false;

  const labels = {
    title: t("title"),
    description: t("description"),
    responseOptions: t("responseOptions"),
    chatMode: t("chatMode"),
    chatModeDescription: t("chatModeDescription"),
    aaMode: t("aaMode"),
    aaModeDescription: t("aaModeDescription"),
    previewMode: t("previewMode"),
    previewModeDescription: t("previewModeDescription"),
    noupMode: t("noupMode"),
    noupModeDescription: t("noupModeDescription"),
    alwaysBottom: t("alwaysBottom"),
    alwaysBottomDescription: t("alwaysBottomDescription"),
    reset: t("reset"),
    back: t("back"),
  };

  return (
    <SettingsContent
      labels={labels}
      boards={allBoards.map((b) => ({ id: b.id, name: b.name }))}
      boardsTitle={tCommon("boards")}
      isLoggedIn={!!session}
      canAccessAdmin={canAccessAdmin}
      authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
    />
  );
}
