/* Web push service worker: shows thread notifications and opens the thread on click. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    // Called synchronously: Safari treats a notification shown after an awaited
    // step as "no notification" and may revoke the subscription
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      renotify: true,
      // Safari on macOS plays the alert sound only when this is explicit,
      // even though false is the spec default (verified by A/B on Safari)
      silent: false,
      icon: "/web-app-manifest-192x192.png",
      data: { url: payload.url },
    })
  );
});

// "/trace/{board}/{thread}/recent" -> "/trace/{board}/{thread}"
function threadPath(pathname) {
  const match = pathname.match(/^\/trace\/[^/]+\/[^/]+/);
  return match ? match[0] : pathname;
}

// WebKit (Safari, iOS home screen apps) resolves clients.openWindow with null
// without opening anything. The click target is then remembered for a page
// that starts now (cold start) and sent to pages already open, which navigate
// themselves (see lib/push/navigation.ts).
const NAV_CACHE = "push-navigation";
const NAV_KEY = "/__push-pending-navigation";
const NAV_TTL_MS = 2 * 60 * 1000;

async function savePendingNavigation(url) {
  const cache = await caches.open(NAV_CACHE);
  await cache.put(NAV_KEY, new Response(JSON.stringify({ url, at: Date.now() })));
}

async function takePendingNavigation() {
  const cache = await caches.open(NAV_CACHE);
  const response = await cache.match(NAV_KEY);
  if (!response) return null;
  await cache.delete(NAV_KEY);
  const { url, at } = await response.json();
  return Date.now() - at < NAV_TTL_MS ? url : null;
}

async function clearPendingNavigation() {
  const cache = await caches.open(NAV_CACHE);
  await cache.delete(NAV_KEY);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin);
  const targetThread = threadPath(target.pathname);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      // Any tab already on this thread counts, whatever range or filter it shows
      const existing = windows.find((w) => {
        const url = new URL(w.url);
        return url.origin === target.origin && threadPath(url.pathname) === targetThread;
      });
      if (existing) return existing.focus();

      const opened = await self.clients.openWindow(target.href).catch(() => null);
      if (opened) return opened;

      const path = target.pathname + target.search;
      await savePendingNavigation(path);
      for (const w of windows) w.postMessage({ type: "push-navigate", url: path });
      if (windows[0]) await windows[0].focus().catch(() => null);
    })()
  );
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "push-pending-request") {
    event.waitUntil(
      takePendingNavigation().then((url) => {
        if (event.ports[0]) event.ports[0].postMessage({ url });
      })
    );
  } else if (type === "push-pending-clear") {
    event.waitUntil(clearPendingNavigation());
  }
});
