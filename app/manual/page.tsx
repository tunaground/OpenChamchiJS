import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { boardService } from "@/lib/services/board";
import { ManualContent } from "./manual-content";

export default async function ManualPage() {
  const [allBoards, session] = await Promise.all([
    boardService.findAll(),
    getServerSession(authOptions),
  ]);

  const t = await getTranslations("manual");
  const tCommon = await getTranslations("common");

  const canAccessAdmin = session
    ? await permissionService.checkUserPermission(session.user.id, "admin:read")
    : false;

  return (
    <ManualContent
      boards={allBoards.map((b) => ({ id: b.id, name: b.name }))}
      isLoggedIn={!!session}
      canAccessAdmin={canAccessAdmin}
      authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
      boardsTitle={tCommon("boards")}
      manualLabel={tCommon("manual")}
      labels={{
        title: t("title"),
        description: t("description"),
        basics: {
          title: t("basics.title"),
          threadTitle: t("basics.threadTitle"),
          threadDescription: t("basics.threadDescription"),
          responseTitle: t("basics.responseTitle"),
          responseDescription: t("basics.responseDescription"),
          authorIdTitle: t("basics.authorIdTitle"),
          authorIdDescription: t("basics.authorIdDescription"),
        },
        threadSettings: {
          title: t("threadSettings.title"),
          description: t("threadSettings.description"),
          endedTitle: t("threadSettings.endedTitle"),
          endedDescription: t("threadSettings.endedDescription"),
          passwordTitle: t("threadSettings.passwordTitle"),
          passwordDescription: t("threadSettings.passwordDescription"),
        },
        settings: {
          title: t("settings.title"),
          description: t("settings.description"),
          aaModeTitle: t("settings.aaModeTitle"),
          aaModeDescription: t("settings.aaModeDescription"),
          previewModeTitle: t("settings.previewModeTitle"),
          previewModeDescription: t("settings.previewModeDescription"),
          noupModeTitle: t("settings.noupModeTitle"),
          noupModeDescription: t("settings.noupModeDescription"),
          alwaysBottomTitle: t("settings.alwaysBottomTitle"),
          alwaysBottomDescription: t("settings.alwaysBottomDescription"),
          quickSubmitTitle: t("settings.quickSubmitTitle"),
          quickSubmitDescription: t("settings.quickSubmitDescription"),
          sidebarSwipeTitle: t("settings.sidebarSwipeTitle"),
          sidebarSwipeDescription: t("settings.sidebarSwipeDescription"),
          chatModeTitle: t("settings.chatModeTitle"),
          chatModeDescription: t("settings.chatModeDescription"),
        },
        tom: {
          title: t("tom.title"),
          description: t("tom.description"),
          boldTitle: t("tom.boldTitle"),
          boldExample: t("tom.boldExample"),
          italicTitle: t("tom.italicTitle"),
          italicExample: t("tom.italicExample"),
          colorTitle: t("tom.colorTitle"),
          colorExample: t("tom.colorExample"),
          colorGlowTitle: t("tom.colorGlowTitle"),
          colorGlowExample: t("tom.colorGlowExample"),
          spoilerTitle: t("tom.spoilerTitle"),
          spoilerExample: t("tom.spoilerExample"),
          rubyTitle: t("tom.rubyTitle"),
          rubyExample: t("tom.rubyExample"),
          aaTitle: t("tom.aaTitle"),
          aaExample: t("tom.aaExample"),
          diceTitle: t("tom.diceTitle"),
          diceExample: t("tom.diceExample"),
          calcTitle: t("tom.calcTitle"),
          calcExample: t("tom.calcExample"),
          anchorTitle: t("tom.anchorTitle"),
          anchorExample: t("tom.anchorExample"),
          youtubeTitle: t("tom.youtubeTitle"),
          youtubeExample: t("tom.youtubeExample"),
          hrTitle: t("tom.hrTitle"),
          hrExample: t("tom.hrExample"),
        },
        sidebar: {
          title: t("sidebar.title"),
          description: t("sidebar.description"),
          backTitle: t("sidebar.backTitle"),
          backDescription: t("sidebar.backDescription"),
          manageTitle: t("sidebar.manageTitle"),
          manageDescription: t("sidebar.manageDescription"),
          viewAllTitle: t("sidebar.viewAllTitle"),
          viewAllDescription: t("sidebar.viewAllDescription"),
          viewRecentTitle: t("sidebar.viewRecentTitle"),
          viewRecentDescription: t("sidebar.viewRecentDescription"),
          prevTitle: t("sidebar.prevTitle"),
          prevDescription: t("sidebar.prevDescription"),
          nextTitle: t("sidebar.nextTitle"),
          nextDescription: t("sidebar.nextDescription"),
          scrollUpTitle: t("sidebar.scrollUpTitle"),
          scrollUpDescription: t("sidebar.scrollUpDescription"),
          scrollDownTitle: t("sidebar.scrollDownTitle"),
          scrollDownDescription: t("sidebar.scrollDownDescription"),
        },
      }}
    />
  );
}
