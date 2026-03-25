import crypto from "crypto";
import { getWsTokenSecret } from "../../config.server";

/**
 * Generate a client ID based on IP address
 * Same IP will get the same client ID for presence deduplication
 */
export function generateClientId(clientIp: string): string {
  return crypto.createHash("sha256").update(clientIp).digest("hex").slice(0, 16);
}

/**
 * Create a signed token for WebSocket authentication
 * Format: base64url(payload).hmac-sha256(payload, secret)
 */
export async function createWsToken(
  clientIp: string
): Promise<{ token: string }> {
  const secret = await getWsTokenSecret();
  if (!secret) {
    throw new Error("WS_TOKEN_SECRET is not configured");
  }

  const clientId = generateClientId(clientIp);
  const payload = Buffer.from(
    JSON.stringify({
      clientId,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return { token: `${payload}.${signature}` };
}
