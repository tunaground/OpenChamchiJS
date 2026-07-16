import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleService } from "@/lib/services/role";
import { globalSettingsService } from "@/lib/services/global-settings";
import { updateSettingsSchema } from "@/lib/schemas";
import { validateOrigin } from "@/lib/api/csrf";

// GET /api/settings - Get global settings
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPermission = await roleService.isAdmin(session.user.id);

  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await globalSettingsService.get();
  return NextResponse.json(settings);
}

// PUT /api/settings - Update global settings
export async function PUT(request: NextRequest) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Require ADMIN role for global settings
  const hasPermission = await roleService.isAdmin(session.user.id);

  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await globalSettingsService.update(parsed.data);
  return NextResponse.json(settings);
}
