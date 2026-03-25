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
 * Get the WS server API URL (server-side, for publishing)
 */
export async function getWsApiUrl(): Promise<string | null> {
  const settings = await globalSettingsService.get();
  return settings.realtimeWsApiUrl || process.env.WS_API_URL || null;
}

/**
 * Get the WS server API key (server-side, for publishing)
 */
export async function getWsApiKey(): Promise<string | null> {
  const settings = await globalSettingsService.get();
  return settings.realtimeWsApiKey || process.env.WS_API_KEY || null;
}

/**
 * Get the WS token secret (server-side, for token generation)
 */
export async function getWsTokenSecret(): Promise<string | null> {
  const settings = await globalSettingsService.get();
  return settings.realtimeWsTokenSecret || process.env.WS_TOKEN_SECRET || null;
}

/**
 * Get the WS server public URL (for client WebSocket connections)
 */
export async function getWsServerUrl(): Promise<string | null> {
  const settings = await globalSettingsService.get();
  return settings.realtimeWsUrl || process.env.WS_SERVER_URL || null;
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
    case "ws": {
      const apiUrl = await getWsApiUrl();
      const apiKey = await getWsApiKey();
      const tokenSecret = await getWsTokenSecret();
      return !!apiUrl && !!apiKey && !!tokenSecret;
    }
    case "pusher":
      return false;
    case "socketio":
      return false;
    default:
      return false;
  }
}
