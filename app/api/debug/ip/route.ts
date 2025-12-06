import { NextRequest, NextResponse } from "next/server";
import { getCountryCode, isGeoIpAvailable } from "@/lib/ip";
import { getClientIp } from "@/lib/api/foreign-ip-check";
import { globalSettingsService } from "@/lib/services/global-settings";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const detectedCountry = await getCountryCode(ip);
  const allowedCountry = await globalSettingsService.getCountryCode();
  const geoIpAvailable = isGeoIpAvailable();

  const headers = {
    "x-forwarded-for": request.headers.get("x-forwarded-for"),
    "x-real-ip": request.headers.get("x-real-ip"),
  };

  return NextResponse.json({
    ip,
    detectedCountry,
    allowedCountry,
    geoIpAvailable,
    isForeign: detectedCountry ? detectedCountry !== allowedCountry : null,
    headers,
  });
}
