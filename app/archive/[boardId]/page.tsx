import { notFound } from "next/navigation";
import { globalSettingsService } from "@/lib/services/global-settings";
import { ArchiveLayout } from "../_components/ArchiveLayout";
import { ArchiveBoardContent } from "../_components/ArchiveBoardContent";

interface Props {
  params: Promise<{ boardId: string }>;
}

export default async function ArchiveBoardPage({ params }: Props) {
  const { boardId } = await params;
  const settings = await globalSettingsService.get();

  const board = settings.archiveBoards.find((b) => b.id === boardId);
  if (!board) {
    notFound();
  }

  return (
    <ArchiveLayout title={`${board.name} Archive`} boards={settings.archiveBoards}>
      <ArchiveBoardContent boardId={boardId} baseUrl={settings.archiveBaseUrl || ""} />
    </ArchiveLayout>
  );
}
