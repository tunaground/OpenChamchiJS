// Hosts of the browser push services (FCM, Mozilla autopush, WNS, Apple).
// Stored endpoints are POSTed to by the server, so anything else is refused.
const PUSH_SERVICE_HOST_SUFFIXES = [
  "googleapis.com",
  "push.services.mozilla.com",
  "notify.windows.com",
  "push.apple.com",
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return PUSH_SERVICE_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}
