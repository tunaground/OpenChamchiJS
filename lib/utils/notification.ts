/**
 * Browser notification utilities
 */

/**
 * Request notification permission from the browser
 * @returns true if permission is granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

/**
 * Show a browser notification
 * @param title - Notification title
 * @param body - Notification body text
 */
export function showNotification(title: string, body: string): void {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  new Notification(title, { body });
}

/**
 * Create a throttled notifier that shows only the last notification
 * within the throttle window
 * @param delayMs - Throttle delay in milliseconds
 * @returns Throttled notify function
 */
export function createThrottledNotifier(delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingNotification: { title: string; body: string } | null = null;

  return (title: string, body: string) => {
    pendingNotification = { title, body };

    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        if (pendingNotification) {
          showNotification(pendingNotification.title, pendingNotification.body);
        }
        timeoutId = null;
        pendingNotification = null;
      }, delayMs);
    }
  };
}
