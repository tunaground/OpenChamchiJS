import Ably from "ably";

let ablyRestClient: Ably.Rest | null = null;

/**
 * Get shared Ably REST client (server-side only)
 * Used by publisher and token generation
 * Uses singleton pattern to reuse connections
 */
export function getAblyRestClient(): Ably.Rest {
  if (ablyRestClient) {
    return ablyRestClient;
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    throw new Error("ABLY_API_KEY environment variable is not set");
  }

  ablyRestClient = new Ably.Rest({ key: apiKey });
  return ablyRestClient;
}

/**
 * Reset the Ably client (for testing purposes)
 */
export function resetAblyClient(): void {
  ablyRestClient = null;
}
