import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { roleService } from "@/lib/services/role";
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

  const managed = session
    ? await roleService.listManagedBoardIds(session.user.id)
    : null;
  const canAccessAdmin = managed !== null && (managed === "all" || managed.length > 0);

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
