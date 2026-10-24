"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  handlePushNavigation,
  PUSH_NAVIGATE,
  PUSH_PENDING_CLEAR,
  PUSH_PENDING_REQUEST,
} from "@/lib/push/navigation";

// Reply and new-thread textareas carry data-draft
function hasDraft(): boolean {
  return Array.from(document.querySelectorAll<HTMLTextAreaElement>("textarea[data-draft]")).some(
    (textarea) => textarea.value.trim() !== ""
  );
}

/**
 * Follows notification clicks the service worker could not open itself
 * (WebKit): a message while this page is open, or a target remembered from
 * a click that launched the app.
 */
export function usePushNavigation(enabled: boolean, confirmMessage: string): void {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !("serviceWorker" in navigator)) return;
    const container = navigator.serviceWorker;

    const handle = (url: string) =>
      handlePushNavigation(url, {
        currentPath: window.location.pathname,
        hasDraft,
        confirm: (message) => window.confirm(message),
        navigate: (path) => router.push(path),
        confirmMessage,
      });

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== PUSH_NAVIGATE) return;
      // Handled here: the next page must not replay it, even if the user stays
      container.controller?.postMessage({ type: PUSH_PENDING_CLEAR });
      handle(event.data.url);
    };

    container.addEventListener("message", onMessage);
    container.startMessages();

    container.ready.then((registration) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data?.url) handle(event.data.url);
      };
      registration.active?.postMessage({ type: PUSH_PENDING_REQUEST }, [channel.port2]);
    });

    return () => container.removeEventListener("message", onMessage);
  }, [enabled, confirmMessage, router]);
}
