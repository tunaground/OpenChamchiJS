/**
 * Server-side realtime provider configuration
 *
 * Reads from GlobalSettings (DB) with environment variable fallback.
 * This file imports server-only modules and must not be used in client components.
 */

import { globalSettingsService } from "@/lib/services/global-settings";
import type { RealtimeProvider } from "./config";

/**
 * Get the server-side realtime provider
 * Reads from GlobalSettings with env fallback
 */
export async function getServerRealtimeProvider(): Promise<RealtimeProvider | null> {
  const settings = await globalSettingsService.get();
  const provider = settings.realtimeProvider || process.env.REALTIME_PROVIDER;
  if (!provider) return null;
  return provider as RealtimeProvider;
}

/**
 * Get the realtime API key from GlobalSettings with env fallback
 */
export async function getRealtimeApiKey(): Promise<string | null> {
  const settings = await globalSettingsService.get();
  return settings.realtimeApiKey || process.env.ABLY_API_KEY || null;
}

/**
 * Check if server-side realtime is enabled and properly configured
 */
export async function isServerRealtimeEnabled(): Promise<boolean> {
  const provider = await getServerRealtimeProvider();
  if (!provider) return false;

  switch (provider) {
    case "ably": {
      const apiKey = await getRealtimeApiKey();
      return !!apiKey;
    }
    case "pusher":
      return false;
    case "socketio":
      return false;
    default:
      return false;
  }
}
