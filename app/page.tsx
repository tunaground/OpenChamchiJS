import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { boardService } from "@/lib/services/board";
import { HomeContent } from "./home-content";

export default async function HomePage() {
  const [allBoards, session] = await Promise.all([
    boardService.findAll(),
    getServerSession(authOptions),
  ]);

  const tCommon = await getTranslations("common");

  const canAccessAdmin = session
    ? await permissionService.checkUserPermission(session.user.id, "admin:read")
    : false;

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "OpenChamchiJS";

  return (
    <HomeContent
      boards={allBoards.map((b) => ({ id: b.id, name: b.name }))}
      isLoggedIn={!!session}
      canAccessAdmin={canAccessAdmin}
      authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
      boardsTitle={tCommon("boards")}
      siteName={siteName}
      manualLabel={tCommon("manual")}
    />
  );
}
