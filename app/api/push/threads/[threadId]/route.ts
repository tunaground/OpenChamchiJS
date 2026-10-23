import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { validateOrigin } from "@/lib/api/csrf";
import { handleServiceError } from "@/lib/api/error-handler";
import { threadWatchService } from "@/lib/services/thread-watch";
import { ServiceError } from "@/lib/services/errors";

interface RouteParams {
  params: Promise<{ threadId: string }>;
}

// DELETE /api/push/threads/[threadId] - Unwatch a thread by its id
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const threadId = parseInt((await params).threadId, 10);
  if (isNaN(threadId)) {
    return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
  }

  try {
    await threadWatchService.unwatchThread(auth.user.id, threadId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ServiceError) return handleServiceError(error);
    throw error;
  }
}
