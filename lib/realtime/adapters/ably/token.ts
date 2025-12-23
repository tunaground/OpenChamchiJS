import Ably from "ably";
import crypto from "crypto";
import { getAblyRestClient } from "./client";

/**
 * Generate a client ID based on IP address
 * Same IP will get the same client ID, so multiple tabs from same IP count as 1 user
 */
function generateClientId(clientIp: string): string {
  return crypto.createHash("sha256").update(clientIp).digest("hex").slice(0, 16);
}

/**
 * Generate a token request for client authentication
 * This is used by the token API endpoint
 * @param clientIp - Client IP address for presence deduplication
 */
export async function createAblyTokenRequest(
  clientIp: string
): Promise<Ably.TokenRequest> {
  const client = getAblyRestClient();
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: generateClientId(clientIp),
    capability: {
      "thread:*": ["subscribe", "presence"],
      "board:*": ["subscribe", "presence"],
    },
  });
  return tokenRequest;
}
