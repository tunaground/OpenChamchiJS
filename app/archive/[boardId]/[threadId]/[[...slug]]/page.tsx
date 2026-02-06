import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { PageLayout } from "@/components/layout";
import { ArchiveBoardListSidebar } from "../../../_components/ArchiveBoardListSidebar";
import { ArchiveThreadContent } from "../../../_components/ArchiveThreadContent";
import { fetchArchiveThread } from "../../../_lib/api";
import { ARCHIVE_CONFIG } from "../../../_lib/config";
import { parseSlugToHighlightSeqs } from "../../../_lib/utils";

interface Props {
  params: Promise<{
    boardId: string;
    threadId: string;
    slug?: string[];
  }>;
}

export default async function ArchiveThreadPage({ params }: Props) {
  const { boardId, threadId, slug } = await params;
  const threadIdNum = parseInt(threadId, 10);

  // Validate board
  const board = ARCHIVE_CONFIG.boards.find((b) => b.id === boardId);
  if (!board || isNaN(threadIdNum)) {
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
    const thread = await fetchArchiveThread(boardId, threadIdNum);
    const highlightSeqs = parseSlugToHighlightSeqs(slug);

    return (
      <PageLayout
        title={thread.title}
        sidebar={<ArchiveBoardListSidebar />}
        isLoggedIn={!!session}
        canAccessAdmin={canAccessAdmin}
        authLabels={{ login: tCommon("login"), logout: tCommon("logout") }}
      >
        <ArchiveThreadContent
          boardId={boardId}
          boardName={board.name}
          thread={thread}
          highlightSeqs={highlightSeqs}
        />
      </PageLayout>
    );
  } catch {
    notFound();
  }
}
