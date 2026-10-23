import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { validateOrigin } from "@/lib/api/csrf";
import { handleServiceError } from "@/lib/api/error-handler";
import { threadWatchService } from "@/lib/services/thread-watch";
import { ServiceError } from "@/lib/services/errors";
import { watchThreadSchema } from "@/lib/schemas";

// GET /api/push/watches - List the caller's watched threads
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  try {
    const list = await threadWatchService.list(auth.user.id);
    return NextResponse.json(list);
  } catch (error) {
    if (error instanceof ServiceError) return handleServiceError(error);
    throw error;
  }
}

// POST /api/push/watches - Watch a thread
export async function POST(request: NextRequest) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const parsed = watchThreadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await threadWatchService.watch(auth.user.id, parsed.data.threadId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ServiceError) return handleServiceError(error);
    throw error;
  }
}
