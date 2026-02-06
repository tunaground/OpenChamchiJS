import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { PageLayout } from "@/components/layout";
import { ArchiveBoardListSidebar } from "./_components/ArchiveBoardListSidebar";
import { ArchiveHomeContent } from "./_components/ArchiveHomeContent";

export default async function ArchivePage() {
  const session = await getServerSession(authOptions);
  const tCommon = await getTranslations("common");

  const canAccessAdmin = session
    ? await permissionService.checkUserPermission(session.user.id, "admin:read")
    : false;

  return (
    <PageLayout
      title="Archive"
      sidebar={<ArchiveBoardListSidebar />}
      isLoggedIn={!!session}
      canAccessAdmin={canAccessAdmin}
      authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
    >
      <ArchiveHomeContent />
    </PageLayout>
  );
}
