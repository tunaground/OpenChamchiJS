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
 * "Viewing" means the page is visible AND its window has focus, so a thread
 * left open on screen while another app is in use still gets pushes.
 * hasFocus() stays true when focus moves into an embedded iframe (YouTube).
 */
export function isActivelyViewing(doc: Document): boolean {
  return doc.visibilityState === "visible" && doc.hasFocus();
}

/**
 * While `active` and the user is actively viewing the page, tells the server
 * so web push for this thread is suppressed.
 */
export function useThreadViewingHeartbeat(threadId: number, active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const url = `/api/push/viewing/${threadId}`;
    let timer: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    const sendViewing = () => {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewing: true }),
        keepalive: true,
      }).catch(() => {});
    };

    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
      sendLeftBeacon(url);
    };

    const tick = () => {
      // Catches focus changes whose events were missed
      if (isActivelyViewing(document)) sendViewing();
      else stop();
    };

    const sync = () => {
      if (disposed) return;
      if (!isActivelyViewing(document)) {
        stop();
      } else if (!timer) {
        sendViewing();
        timer = setInterval(tick, HEARTBEAT_INTERVAL_MS);
      }
    };

    // blur also fires when focus moves into an iframe on the page; re-check
    // after focus settles instead of treating every blur as leaving
    const onBlur = () => setTimeout(sync, 0);

    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", stop);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [threadId, active]);
}
