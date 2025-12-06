import fs from "fs";
import path from "path";
import { Reader } from "@maxmind/geoip2-node";

type ReaderModel = Awaited<ReturnType<typeof Reader.open>>;

const MMDB_PATH = path.join(process.cwd(), "lib/GeoLite2-Country.mmdb");

let readerPromise: Promise<ReaderModel | null> | null = null;

function getReader(): Promise<ReaderModel | null> {
  if (!readerPromise) {
    // Check if mmdb file exists
    if (!fs.existsSync(MMDB_PATH)) {
      readerPromise = Promise.resolve(null);
    } else {
      readerPromise = Reader.open(MMDB_PATH).catch(() => null);
    }
  }
  return readerPromise;
}

/**
 * Check if the GeoIP database is available
 */
export function isGeoIpAvailable(): boolean {
  return fs.existsSync(MMDB_PATH);
}

export async function getCountryCode(ip: string): Promise<string | null> {
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
    const reader = await getReader();
    if (!reader) {
      // No mmdb file available, allow all
      return null;
    }
    const response = reader.country(ip);
    return response.country?.isoCode || null;
  } catch {
    // If lookup fails, allow the request
    return null;
  }
}

export async function isForeignIp(
  ip: string,
  allowedCountryCode: string
): Promise<boolean> {
  const countryCode = await getCountryCode(ip);

  // If we couldn't determine country, allow
  if (!countryCode) {
    return false;
  }

  return countryCode !== allowedCountryCode;
}
