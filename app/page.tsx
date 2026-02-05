import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { boardService } from "@/lib/services/board";
import { globalSettingsService } from "@/lib/services/global-settings";
import { HomeContent } from "./home-content";

export default async function HomePage() {
  const [allBoards, session, settings] = await Promise.all([
    boardService.findAll(),
    getServerSession(authOptions),
    globalSettingsService.get(),
  ]);

  const tCommon = await getTranslations("common");

  const canAccessAdmin = session
    ? await permissionService.checkUserPermission(session.user.id, "admin:read")
    : false;

  return (
    <HomeContent
      boards={allBoards.map((b) => ({ id: b.id, name: b.name }))}
      isLoggedIn={!!session}
      canAccessAdmin={canAccessAdmin}
      authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
      boardsTitle={tCommon("boards")}
      siteName={settings.siteTitle}
      manualLabel={tCommon("manual")}
      homepageContent={settings.homepageContent}
      customLinks={settings.customLinks}
    />
  );
}
