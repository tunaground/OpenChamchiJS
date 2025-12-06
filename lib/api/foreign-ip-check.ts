import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isForeignIp } from "@/lib/ip";
import { globalSettingsService } from "@/lib/services/global-settings";
import { permissionService } from "@/lib/services/permission";
import { BoardData } from "@/lib/repositories/interfaces/board";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "127.0.0.1";
}

export async function checkForeignIpBlocked(
  request: NextRequest,
  board: BoardData
): Promise<NextResponse | null> {
  // If board doesn't block foreign IPs, allow
  if (!board.blockForeignIp) {
    return null;
  }

  const ip = getClientIp(request);
  const countryCode = await globalSettingsService.getCountryCode();
  const isForeign = await isForeignIp(ip, countryCode);

  // If not foreign, allow
  if (!isForeign) {
    return null;
  }

  // Check if user has foreign:write permission
  const session = await getServerSession(authOptions);
  if (session) {
    const hasPermission = await permissionService.checkUserPermission(
      session.user.id,
      "foreign:write"
    );
    if (hasPermission) {
      return null;
    }
  }

  // Block foreign IP
  return NextResponse.json(
    { error: "Foreign IP addresses are not allowed to write on this board" },
    { status: 403 }
  );
}
