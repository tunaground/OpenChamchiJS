import { notFound } from "next/navigation";
import { ArchiveLayout } from "../../../_components/ArchiveLayout";
import { ArchiveThreadContent } from "../../../_components/ArchiveThreadContent";
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

  const board = ARCHIVE_CONFIG.boards.find((b) => b.id === boardId);
  if (!board || isNaN(threadIdNum)) {
    notFound();
  }

  const highlightSeqs = parseSlugToHighlightSeqs(slug);

  return (
    <ArchiveLayout>
      <ArchiveThreadContent
        boardId={boardId}
        boardName={board.name}
        threadId={threadIdNum}
        highlightSeqs={highlightSeqs}
      />
    </ArchiveLayout>
  );
}
