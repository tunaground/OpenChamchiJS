import type { RealtimePublisher } from "./ports/realtime";
import { getServerRealtimeProvider, isServerRealtimeEnabled } from "./config";
import { RealtimeError } from "./errors";

let publisherInstance: RealtimePublisher | null = null;

/**
 * Get the realtime publisher instance (server-side only)
 * Uses singleton pattern to reuse the same instance
 */
export function getPublisher(): RealtimePublisher {
  if (publisherInstance) {
    return publisherInstance;
  }

  const provider = getServerRealtimeProvider();

  if (!provider) {
    throw new RealtimeError(
      "REALTIME_PROVIDER environment variable is not set",
      "NOT_CONFIGURED"
    );
  }

  let instance: RealtimePublisher;

  switch (provider) {
    case "ably": {
      // Dynamic import to avoid bundling unused adapters
      const { AblyPublisher } = require("./adapters/ably/publisher");
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
 * Reset the publisher instance (for testing)
 */
export function resetPublisher(): void {
  publisherInstance = null;
}
