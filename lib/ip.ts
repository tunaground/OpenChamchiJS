import fs from "fs";
import path from "path";
import { Reader } from "@maxmind/geoip2-node";

type ReaderModel = ReturnType<typeof Reader.openBuffer>;

const MMDB_PATH = path.join(process.cwd(), "lib/GeoLite2-Country.mmdb");

let reader: ReaderModel | null = null;

function getReader(): ReaderModel | null {
  if (!reader) {
    if (!fs.existsSync(MMDB_PATH)) {
      return null;
    }
    try {
      const buffer = fs.readFileSync(MMDB_PATH);
      reader = Reader.openBuffer(buffer);
    } catch (err) {
      console.error("Failed to open GeoIP database:", err);
      return null;
    }
  }
  return reader;
}

/**
 * Check if the GeoIP database is available
 */
export function isGeoIpAvailable(): boolean {
  return fs.existsSync(MMDB_PATH);
}

export function getCountryCode(ip: string): string | null {
  // Skip for localhost/private IPs
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) {
    return null; // Local/private IP - allow
  }

  try {
    const r = getReader();
    if (!r) {
      return null;
    }
    const response = r.country(ip);
    return response.country?.isoCode || null;
  } catch {
    return null;
  }
}

export function isForeignIp(
  ip: string,
  allowedCountryCode: string
): boolean {
  const countryCode = getCountryCode(ip);

  // If we couldn't determine country, allow
  if (!countryCode) {
    return false;
  }

  return countryCode !== allowedCountryCode;
}
