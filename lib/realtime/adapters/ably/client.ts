import Ably from "ably";
import { getRealtimeApiKey } from "../../config.server";

let ablyRestClient: Ably.Rest | null = null;

/**
 * Get shared Ably REST client (server-side only)
 * Reads API key from GlobalSettings with env fallback
 * Uses singleton pattern to reuse connections
 */
export async function getAblyRestClient(): Promise<Ably.Rest> {
  if (ablyRestClient) {
    return ablyRestClient;
  }

  const apiKey = await getRealtimeApiKey();
  if (!apiKey) {
    throw new Error("Ably API key is not configured");
  }

  ablyRestClient = new Ably.Rest({ key: apiKey });
  return ablyRestClient;
}

/**
 * Reset the Ably client (for settings changes and testing)
 */
export function resetAblyClient(): void {
  ablyRestClient = null;
}
