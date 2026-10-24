"use client";

import { create } from "zustand";
import type { ThreadWatchListItem } from "@/lib/repositories/interfaces/thread-watch";

interface PushWatchState {
  loaded: boolean;
  items: ThreadWatchListItem[];
  limit: number;
  pushEnabled: boolean;
  load: () => Promise<void>;
  ensureLoaded: () => Promise<void>;
  watch: (threadId: number) => Promise<"ok" | "limit">;
  unwatchThread: (threadId: number) => Promise<void>;
  remove: (watchId: string) => Promise<void>;
  setEnabled: (watchId: string, enabled: boolean) => Promise<void>;
  setPushEnabled: (enabled: boolean) => Promise<void>;
}

async function send(url: string, method: string, body?: unknown): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`${method} ${url} failed: ${res.status}`);
  }
  return res;
}

let loadPromise: Promise<void> | null = null;

export const usePushWatchStore = create<PushWatchState>((set, get) => {
  // Apply an optimistic change; on failure roll back and reload from the server
  async function optimistic(apply: () => void, request: () => Promise<unknown>) {
    const snapshot = { items: get().items, pushEnabled: get().pushEnabled };
    apply();
    try {
      await request();
    } catch (error) {
      console.error("Push watch update failed:", error);
      set(snapshot);
      await get().load();
    }
  }

  return {
    loaded: false,
    items: [],
    limit: 0,
    pushEnabled: true,

    async load() {
      try {
        const res = await fetch("/api/push/watches");
        if (!res.ok) return;
        const data = await res.json();
        set({ loaded: true, items: data.items, limit: data.limit, pushEnabled: data.pushEnabled });
      } catch (error) {
        console.error("Failed to load push watches:", error);
      }
    },

    async ensureLoaded() {
      if (get().loaded) return;
      loadPromise ??= get().load().finally(() => {
        loadPromise = null;
      });
      await loadPromise;
    },

    async watch(threadId) {
      const res = await send("/api/push/watches", "POST", { threadId });
      if (res.status === 409) return "limit";
      await get().load();
      return "ok";
    },

    async unwatchThread(threadId) {
      await optimistic(
        () => set({ items: get().items.filter((i) => i.threadId !== threadId) }),
        () => send(`/api/push/threads/${threadId}`, "DELETE")
      );
    },

    async remove(watchId) {
      await optimistic(
        () => set({ items: get().items.filter((i) => i.id !== watchId) }),
        () => send(`/api/push/watches/${watchId}`, "DELETE")
      );
    },

    async setEnabled(watchId, enabled) {
      await optimistic(
        () => set({ items: get().items.map((i) => (i.id === watchId ? { ...i, enabled } : i)) }),
        () => send(`/api/push/watches/${watchId}`, "PATCH", { enabled })
      );
    },

    async setPushEnabled(enabled) {
      await optimistic(
        () => set({ pushEnabled: enabled }),
        () => send("/api/push/settings", "PATCH", { pushEnabled: enabled })
      );
    },
  };
});
