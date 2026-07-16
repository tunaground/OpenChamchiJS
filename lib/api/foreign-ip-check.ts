import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isForeignIp } from "@/lib/ip";
import { globalSettingsService } from "@/lib/services/global-settings";
import { roleService } from "@/lib/services/role";
import { BoardData } from "@/lib/repositories/interfaces/board";

export function getClientIp(request: NextRequest): string {
  // CloudFront proxy (ip:port format)
  const cfViewerAddr = request.headers.get("cloudfront-viewer-address");
  if (cfViewerAddr) {
    const ip = cfViewerAddr.split(":").slice(0, -1).join(":");
    if (ip) return ip;
  }
  // Standard proxy
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
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
  const isForeign = isForeignIp(ip, countryCode);

  // If not foreign, allow
  if (!isForeign) {
    return null;
  }

  // VERIFIED(또는 ADMIN) 계정은 해외 IP 차단 면제
  const session = await getServerSession(authOptions);
  if (session) {
    const verified = await roleService.isVerified(session.user.id);
    if (verified) {
      return null;
    }
  }

  // Block foreign IP
  return NextResponse.json(
    { error: "FOREIGN_IP_BLOCKED" },
    { status: 403 }
  );
}
