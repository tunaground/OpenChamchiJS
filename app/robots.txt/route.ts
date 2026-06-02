import { globalSettingsService } from "@/lib/services/global-settings";
import { DEFAULT_ROBOTS_TXT } from "@/lib/constants/robots";

// Re-run on every request so admin edits to robotsTxt take effect immediately.
// The underlying settings read stays cached and is invalidated on update.
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await globalSettingsService.get();
  const body =
    settings.robotsTxt && settings.robotsTxt.trim().length > 0
      ? settings.robotsTxt
      : DEFAULT_ROBOTS_TXT;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
