import type { RealtimePublisher } from "./interfaces";

const REALTIME_PROVIDER = process.env.REALTIME_PROVIDER || "ably";

let publisherInstance: RealtimePublisher | null = null;

/**
 * Get the realtime publisher instance (server-side only)
 * Uses singleton pattern to reuse the same instance
 */
export function getPublisher(): RealtimePublisher {
  if (publisherInstance) {
    return publisherInstance;
  }

  let instance: RealtimePublisher;

  switch (REALTIME_PROVIDER) {
    case "ably": {
      // Dynamic import to avoid bundling unused adapters
      const { AblyPublisher } = require("./adapters/ably/publisher");
      instance = new AblyPublisher();
      break;
    }
    // Future providers can be added here:
    // case "pusher": { ... }
    // case "socket-io": { ... }
    default:
      throw new Error(`Unknown realtime provider: ${REALTIME_PROVIDER}`);
  }

  publisherInstance = instance;
  return instance;
}

/**
 * Check if realtime publishing is enabled
 * Returns false if no API key is configured
 */
export function isRealtimeEnabled(): boolean {
  switch (REALTIME_PROVIDER) {
    case "ably":
      return !!process.env.ABLY_API_KEY;
    default:
      return false;
  }
}
