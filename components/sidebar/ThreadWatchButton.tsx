"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useToast } from "@/components/Toast";
import { usePushWatchStore } from "@/lib/store/pushWatch";
import { ensureDeviceSubscribed, prepareServiceWorker } from "@/lib/push/client";
import { usePushFeatureEnabled } from "@/lib/hooks/usePushFeatureEnabled";

export interface ThreadWatchToggle {
  visible: boolean;
  watched: boolean;
  label: string;
  toggle: () => Promise<void>;
}

/**
 * Watch/unwatch state for one thread. Subscribes the device first so a
 * watch never exists without a way to deliver it.
 */
export function useThreadWatchToggle(threadId: number, isLoggedIn: boolean): ThreadWatchToggle {
  const t = useTranslations("push");
  const locale = useLocale();
  const { showToast } = useToast();
  const enabled = usePushFeatureEnabled();
  const { items, limit, ensureLoaded, watch, unwatchThread } = usePushWatchStore();
  const [busy, setBusy] = useState(false);

  const visible = enabled && isLoggedIn;
  const watched = items.some((item) => item.threadId === threadId);

  useEffect(() => {
    if (!visible) return;
    ensureLoaded();
    // Ready the worker now so the tap can subscribe without waiting
    prepareServiceWorker();
  }, [visible, ensureLoaded]);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (watched) {
        await unwatchThread(threadId);
        return;
      }
      const device = await ensureDeviceSubscribed(locale);
      if (device === "denied") {
        showToast(t("deviceDenied"));
        return;
      }
      if (device === "unsupported") {
        showToast(t("deviceUnsupported"));
        return;
      }
      if (device === "failed") {
        showToast(t("deviceSubscribeFailed"));
        return;
      }
      if ((await watch(threadId)) === "limit") {
        showToast(t("limitExceeded", { limit }));
      }
    } catch (error) {
      console.error("Failed to toggle thread watch:", error);
    } finally {
      setBusy(false);
    }
  }, [busy, watched, unwatchThread, threadId, locale, showToast, t, watch, limit]);

  return { visible, watched, label: watched ? t("unwatch") : t("watch"), toggle };
}
