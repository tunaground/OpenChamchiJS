import type { RealtimePublisher } from "./ports/realtime";
import { getServerRealtimeProvider, isServerRealtimeEnabled } from "./config.server";
import { RealtimeError } from "./errors";

let publisherInstance: RealtimePublisher | null = null;

/**
 * Get the realtime publisher instance (server-side only)
 * Uses singleton pattern to reuse the same instance
 */
export async function getPublisher(): Promise<RealtimePublisher> {
  if (publisherInstance) {
    return publisherInstance;
  }

  const provider = await getServerRealtimeProvider();

  if (!provider) {
    throw new RealtimeError(
      "Realtime provider is not configured",
      "NOT_CONFIGURED"
    );
  }

  let instance: RealtimePublisher;

  switch (provider) {
    case "ably": {
      const { AblyPublisher } = await import("./adapters/ably/publisher");
      instance = new AblyPublisher();
      break;
    }
    case "pusher": {
      throw new RealtimeError("Pusher adapter not implemented", "NOT_CONFIGURED");
    }
    case "socketio": {
      throw new RealtimeError(
        "Socket.io adapter not implemented",
        "NOT_CONFIGURED"
      );
    }
    default:
      throw new RealtimeError(
        `Unknown realtime provider: ${provider}`,
        "UNKNOWN_PROVIDER"
      );
  }

  publisherInstance = instance;
  return instance;
}

/**
 * Check if realtime publishing is enabled
 * Re-export from config for backward compatibility
 */
export { isServerRealtimeEnabled as isRealtimeEnabled };

/**
 * Reset the publisher instance (for settings changes and testing)
 */
export function resetPublisher(): void {
  publisherInstance = null;
}
