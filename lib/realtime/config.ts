/**
 * Realtime provider configuration
 *
 * Follows the same pattern as lib/storage/index.ts
 * Supports separate server/client env vars for Next.js compatibility
 */

export type RealtimeProvider = "ably" | "pusher" | "socketio";

/**
 * Get the server-side realtime provider
 * Used by publisher and token generation
 */
export function getServerRealtimeProvider(): RealtimeProvider | null {
  const provider = process.env.REALTIME_PROVIDER;
  if (!provider) return null;
  return provider as RealtimeProvider;
}

/**
 * Get the client-side realtime provider
 * Uses NEXT_PUBLIC_ prefix for browser access
 */
export function getClientRealtimeProvider(): RealtimeProvider | null {
  const provider = process.env.NEXT_PUBLIC_REALTIME_PROVIDER;
  if (!provider) return null;
  return provider as RealtimeProvider;
}

/**
 * Check if server-side realtime is enabled and properly configured
 * Validates provider-specific required env vars
 */
export function isServerRealtimeEnabled(): boolean {
  const provider = getServerRealtimeProvider();
  if (!provider) return false;

  switch (provider) {
    case "ably":
      return !!process.env.ABLY_API_KEY;
    case "pusher":
      // Future: check PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER
      return false;
    case "socketio":
      // Future: check SOCKETIO_SERVER_URL
      return false;
    default:
      return false;
  }
}

/**
 * Check if client-side realtime is enabled
 */
export function isClientRealtimeEnabled(): boolean {
  return getClientRealtimeProvider() !== null;
}
