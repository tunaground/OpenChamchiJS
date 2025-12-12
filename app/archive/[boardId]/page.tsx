import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { PageLayout } from "@/components/layout";
import { ArchiveBoardListSidebar } from "../_components/ArchiveBoardListSidebar";
import { ArchiveBoardContent } from "../_components/ArchiveBoardContent";
import { fetchArchiveIndex } from "../_lib/api";
import { ARCHIVE_CONFIG } from "../_lib/config";

interface Props {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function ArchiveBoardPage({ params, searchParams }: Props) {
  const { boardId } = await params;
  const { page, search } = await searchParams;

  // Validate board
  const board = ARCHIVE_CONFIG.boards.find((b) => b.id === boardId);
  if (!board) {
    notFound();
  }

  const [session, tCommon] = await Promise.all([
    getServerSession(authOptions),
    getTranslations("common"),
  ]);

  const canAccessAdmin = session
    ? await permissionService.checkUserPermission(session.user.id, "admin:read")
    : false;

  try {
    const threads = await fetchArchiveIndex(boardId);

    // Sort by updatedAt descending
    threads.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const currentPage = parseInt(page || "1", 10) || 1;

    return (
      <PageLayout
        title={`${board.name} Archive`}
        sidebar={<ArchiveBoardListSidebar />}
        isLoggedIn={!!session}
        canAccessAdmin={canAccessAdmin}
        authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
      >
        <ArchiveBoardContent
          boardId={boardId}
          threads={threads}
          initialPage={currentPage}
          initialSearch={search || ""}
          threadsPerPage={ARCHIVE_CONFIG.threadsPerPage}
        />
      </PageLayout>
    );
  } catch {
    notFound();
  }
}
