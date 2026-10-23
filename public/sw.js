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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin);
  const targetThread = threadPath(target.pathname);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // Any tab already on this thread counts, whatever range or filter it shows
      const existing = windows.find((w) => {
        const url = new URL(w.url);
        return url.origin === target.origin && threadPath(url.pathname) === targetThread;
      });
      if (existing) return existing.focus();
      return self.clients.openWindow(target.href);
    })
  );
});
