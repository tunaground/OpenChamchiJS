"use client";

import { useEffect } from "react";
import { usePushWatchStore } from "@/lib/store/pushWatch";

export const PUSH_RECEIVED = "push-received";

// Coming back after this long reloads the list. Without push (master toggle
// off) nothing marks threads live, so the list goes stale sooner.
const STALE_MS = 5 * 60 * 1000;
const STALE_MS_WITHOUT_PUSH = 60 * 1000;

/**
 * Keeps the sidebar's new-response marks current: a push for a watched
 * thread (relayed by the service worker) marks it at once, and returning to
 * the page after a while reloads the list for anything pushes missed.
 */
export function useWatchedThreadsSync(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const store = usePushWatchStore;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== PUSH_RECEIVED || typeof event.data.threadId !== "number") return;
      store.getState().setHasNew(event.data.threadId, true);
    };

    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      const { pushEnabled, refreshIfStale } = store.getState();
      refreshIfStale(pushEnabled ? STALE_MS : STALE_MS_WITHOUT_PUSH);
    };

    const container = "serviceWorker" in navigator ? navigator.serviceWorker : null;
    container?.addEventListener("message", onMessage);
    container?.startMessages();
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);

    return () => {
      container?.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [enabled]);
}
