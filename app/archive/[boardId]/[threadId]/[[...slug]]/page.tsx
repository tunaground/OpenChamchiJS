import { notFound } from "next/navigation";
import { globalSettingsService } from "@/lib/services/global-settings";
import { ArchiveLayout } from "../../../_components/ArchiveLayout";
import { ArchiveThreadContent } from "../../../_components/ArchiveThreadContent";
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

  const settings = await globalSettingsService.get();

  const board = settings.archiveBoards.find((b) => b.id === boardId);
  if (!board || isNaN(threadIdNum)) {
    notFound();
  }

  const highlightSeqs = parseSlugToHighlightSeqs(slug);

  return (
    <ArchiveLayout boards={settings.archiveBoards}>
      <ArchiveThreadContent
        boardId={boardId}
        boardName={board.name}
        threadId={threadIdNum}
        highlightSeqs={highlightSeqs}
        baseUrl={settings.archiveBaseUrl || ""}
      />
    </ArchiveLayout>
  );
}
