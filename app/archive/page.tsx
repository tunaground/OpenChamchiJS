import { globalSettingsService } from "@/lib/services/global-settings";
import { ArchiveLayout } from "./_components/ArchiveLayout";
import { ArchiveHomeContent } from "./_components/ArchiveHomeContent";

export default async function ArchivePage() {
  const settings = await globalSettingsService.get();

  return (
    <ArchiveLayout title="Archive" boards={settings.archiveBoards}>
      <ArchiveHomeContent />
    </ArchiveLayout>
  );
}
