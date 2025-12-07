"use client";

import type { RealtimeSubscriber } from "./interfaces";

const REALTIME_PROVIDER = process.env.NEXT_PUBLIC_REALTIME_PROVIDER || "ably";

let subscriberInstance: RealtimeSubscriber | null = null;

/**
 * Get the realtime subscriber instance (client-side only)
 * Uses singleton pattern to reuse the same connection
 */
export function getSubscriber(): RealtimeSubscriber {
  if (subscriberInstance) {
    return subscriberInstance;
  }

  let instance: RealtimeSubscriber;

  switch (REALTIME_PROVIDER) {
    case "ably": {
      const { AblySubscriber } = require("./adapters/ably/subscriber");
      instance = new AblySubscriber();
      break;
    }
    // Future providers can be added here:
    // case "pusher": { ... }
    // case "socket-io": { ... }
    default:
      throw new Error(`Unknown realtime provider: ${REALTIME_PROVIDER}`);
  }

  subscriberInstance = instance;
  return instance;
}

/**
 * Reset the subscriber instance
 * Useful for testing or when switching providers
 */
export function resetSubscriber(): void {
  if (subscriberInstance) {
    subscriberInstance.disconnect();
    subscriberInstance = null;
  }
}
