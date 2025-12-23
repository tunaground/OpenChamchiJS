"use client";

import type { RealtimeSubscriber } from "./ports/realtime";
import { getClientRealtimeProvider } from "./config";

let subscriberInstance: RealtimeSubscriber | null = null;

/**
 * Get the realtime subscriber instance (client-side only)
 * Uses singleton pattern to reuse the same connection
 */
export function getSubscriber(): RealtimeSubscriber {
  if (subscriberInstance) {
    return subscriberInstance;
  }

  const provider = getClientRealtimeProvider();

  if (!provider) {
    throw new Error(
      "NEXT_PUBLIC_REALTIME_PROVIDER environment variable is not set"
    );
  }

  let instance: RealtimeSubscriber;

  switch (provider) {
    case "ably": {
      const { AblySubscriber } = require("./adapters/ably/subscriber");
      instance = new AblySubscriber();
      break;
    }
    case "pusher": {
      throw new Error("Pusher subscriber not implemented");
    }
    case "socketio": {
      throw new Error("Socket.io subscriber not implemented");
    }
    default:
      throw new Error(`Unknown realtime provider: ${provider}`);
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
