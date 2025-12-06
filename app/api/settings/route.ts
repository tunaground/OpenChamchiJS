import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { globalSettingsService } from "@/lib/services/global-settings";

const updateSettingsSchema = z.object({
  countryCode: z.string().length(2).toUpperCase().optional(),
});

// GET /api/settings - Get global settings
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPermission = await permissionService.checkUserPermission(
    session.user.id,
    "admin:read"
  );

  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await globalSettingsService.get();
  return NextResponse.json(settings);
}

// PUT /api/settings - Update global settings
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Require all:all permission for global settings
  const hasPermission = await permissionService.checkUserPermission(
    session.user.id,
    "all:all"
  );

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
