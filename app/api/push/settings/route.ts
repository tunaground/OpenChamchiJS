import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { validateOrigin } from "@/lib/api/csrf";
import { handleServiceError } from "@/lib/api/error-handler";
import { threadWatchService } from "@/lib/services/thread-watch";
import { ServiceError } from "@/lib/services/errors";
import { pushSettingsSchema } from "@/lib/schemas";

// PATCH /api/push/settings - Master on/off for the caller's web push
export async function PATCH(request: NextRequest) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const parsed = pushSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await threadWatchService.setPushEnabled(auth.user.id, parsed.data.pushEnabled);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ServiceError) return handleServiceError(error);
    throw error;
  }
}
