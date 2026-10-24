/**
 * Page-side half of notification-click navigation for browsers whose
 * service worker cannot open a window (WebKit: Safari, iOS PWAs return null
 * from clients.openWindow). The worker asks an open page to move instead.
 */

export const PUSH_NAVIGATE = "push-navigate";
export const PUSH_PENDING_REQUEST = "push-pending-request";
export const PUSH_PENDING_CLEAR = "push-pending-clear";

export interface PushNavigationDeps {
  currentPath: string;
  hasDraft: () => boolean;
  confirm: (message: string) => boolean;
  navigate: (path: string) => void;
  confirmMessage?: string;
}

// "/trace/{board}/{thread}/..." -> "/trace/{board}/{thread}"
function threadPath(pathname: string): string {
  const match = pathname.match(/^\/trace\/[^/]+\/[^/]+/);
  return match ? match[0] : pathname;
}

export function handlePushNavigation(url: string, deps: PushNavigationDeps): void {
  // Only same-site, root-relative paths (the worker sends "/trace/...")
  if (!url.startsWith("/") || url.startsWith("//")) return;

  const target = new URL(url, "http://local");
  if (threadPath(target.pathname) === threadPath(deps.currentPath)) return;

  if (deps.hasDraft() && !deps.confirm(deps.confirmMessage ?? "")) return;
  deps.navigate(target.pathname + target.search);
}
