/**
 * Realtime provider configuration (client-safe)
 *
 * This file must NOT import any server-only modules (Prisma, DB, etc.)
 * Server-side functions are in config.server.ts
 */

export type RealtimeProvider = "ably" | "pusher" | "socketio";

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: { realtimeProvider?: string };
  }
}

/**
 * Get the client-side realtime provider
 * Uses window.__RUNTIME_CONFIG__ with NEXT_PUBLIC_ env fallback
 */
export function getClientRealtimeProvider(): RealtimeProvider | null {
  if (typeof window !== "undefined" && window.__RUNTIME_CONFIG__?.realtimeProvider) {
    return window.__RUNTIME_CONFIG__.realtimeProvider as RealtimeProvider;
  }
  const provider = process.env.NEXT_PUBLIC_REALTIME_PROVIDER;
  if (!provider) return null;
  return provider as RealtimeProvider;
}

/**
 * Check if client-side realtime is enabled
 */
export function isClientRealtimeEnabled(): boolean {
  return getClientRealtimeProvider() !== null;
}
