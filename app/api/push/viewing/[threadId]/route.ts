import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api/auth";
import { validateOrigin } from "@/lib/api/csrf";
import { threadWatchService } from "@/lib/services/thread-watch";
import { viewingSchema } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ threadId: string }>;
}

// POST /api/push/viewing/[threadId] - Heartbeat while the thread is on screen.
// Always 204: it is fire-and-forget (often sent via sendBeacon).
export async function POST(request: NextRequest, { params }: RouteParams) {
  const noContent = new NextResponse(null, { status: 204 });

  if (validateOrigin(request)) return noContent;

  const user = await getAuthUser();
  if (!user) return noContent;

  const threadId = parseInt((await params).threadId, 10);
  const parsed = viewingSchema.safeParse(await request.json().catch(() => null));
  if (isNaN(threadId) || !parsed.success) return noContent;

  try {
    await threadWatchService.reportViewing(user.id, threadId, parsed.data.viewing);
  } catch (error) {
    console.error("Failed to record viewing heartbeat:", error);
  }
  return noContent;
}
