import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { validateOrigin } from "@/lib/api/csrf";
import { handleServiceError } from "@/lib/api/error-handler";
import { pushSubscriptionService } from "@/lib/services/push-subscription";
import { ServiceError } from "@/lib/services/errors";
import { pushSubscriptionSchema, pushUnsubscribeSchema } from "@/lib/schemas";

// POST /api/push/subscriptions - Register or refresh this device's subscription
export async function POST(request: NextRequest) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const parsed = pushSubscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await pushSubscriptionService.subscribe({
      userId: auth.user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      locale: parsed.data.locale,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ServiceError) return handleServiceError(error);
    throw error;
  }
}

// DELETE /api/push/subscriptions - Detach this device (caller's own only)
export async function DELETE(request: NextRequest) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const parsed = pushUnsubscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await pushSubscriptionService.unsubscribe(auth.user.id, parsed.data.endpoint);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ServiceError) return handleServiceError(error);
    throw error;
  }
}
