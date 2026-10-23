"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Tells the server the user left. A plain string body avoids Blob content
 * types that some browsers reject, and it must never throw: it also runs
 * during effect cleanup.
 */
export function sendLeftBeacon(url: string): void {
  try {
    navigator.sendBeacon(url, JSON.stringify({ viewing: false }));
  } catch {
    // The server falls back to the 45s heartbeat window
  }
}

/**
 * While `active` and the page is visible, tells the server the user is
 * looking at this thread so web push for it is suppressed.
 */
export function useThreadViewingHeartbeat(threadId: number, active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const url = `/api/push/viewing/${threadId}`;
    let timer: ReturnType<typeof setInterval> | null = null;

    const sendViewing = () => {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewing: true }),
        keepalive: true,
      }).catch(() => {});
    };

    const start = () => {
      if (timer) return;
      sendViewing();
      timer = setInterval(sendViewing, HEARTBEAT_INTERVAL_MS);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      sendLeftBeacon(url);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", stop);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [threadId, active]);
}
