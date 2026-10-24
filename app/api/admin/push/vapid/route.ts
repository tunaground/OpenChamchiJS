import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { validateOrigin } from "@/lib/api/csrf";
import { roleService } from "@/lib/services/role";
import { pushSubscriptionService } from "@/lib/services/push-subscription";

// POST /api/admin/push/vapid - Generate a new VAPID key pair (ADMIN)
export async function POST(request: NextRequest) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  if (!(await roleService.isAdmin(auth.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { publicKey } = await pushSubscriptionService.regenerateVapidKeys();
  return NextResponse.json({ publicKey });
}
