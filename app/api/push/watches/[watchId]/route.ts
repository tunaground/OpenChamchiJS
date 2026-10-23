import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { validateOrigin } from "@/lib/api/csrf";
import { handleServiceError } from "@/lib/api/error-handler";
import { threadWatchService } from "@/lib/services/thread-watch";
import { ServiceError } from "@/lib/services/errors";
import { toggleEnabledSchema } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ watchId: string }>;
}

// PATCH /api/push/watches/[watchId] - Toggle a single watch
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const parsed = toggleEnabledSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { watchId } = await params;
  try {
    await threadWatchService.setEnabled(auth.user.id, watchId, parsed.data.enabled);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ServiceError) return handleServiceError(error);
    throw error;
  }
}

// DELETE /api/push/watches/[watchId] - Remove a watch
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const { watchId } = await params;
  try {
    await threadWatchService.remove(auth.user.id, watchId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ServiceError) return handleServiceError(error);
    throw error;
  }
}
