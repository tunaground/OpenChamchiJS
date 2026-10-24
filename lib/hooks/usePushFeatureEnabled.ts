"use client";

import { useSyncExternalStore } from "react";

// The flag is injected once by the root layout and never changes
const subscribe = () => () => {};

/**
 * Server-injected push flag. Hydration uses the server snapshot (false),
 * so SSR and the first client render agree.
 */
export function usePushFeatureEnabled(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !!window.__RUNTIME_CONFIG__?.pushEnabled,
    () => false
  );
}
