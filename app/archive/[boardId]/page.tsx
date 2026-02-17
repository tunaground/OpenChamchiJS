import { notFound } from "next/navigation";
import { ArchiveLayout } from "../_components/ArchiveLayout";
import { ArchiveBoardContent } from "../_components/ArchiveBoardContent";
import { ARCHIVE_CONFIG } from "../_lib/config";

interface Props {
  params: Promise<{ boardId: string }>;
}

export default async function ArchiveBoardPage({ params }: Props) {
  const { boardId } = await params;

  const board = ARCHIVE_CONFIG.boards.find((b) => b.id === boardId);
  if (!board) {
    notFound();
  }

  return (
    <ArchiveLayout title={`${board.name} Archive`}>
      <ArchiveBoardContent boardId={boardId} />
    </ArchiveLayout>
  );
}
