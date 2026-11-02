/**
 * A heartbeat (every 30s) keeps a watcher "viewing" for this long; pushes
 * for the thread are suppressed meanwhile.
 *
 * On leave, ThreadWatch.lastViewingAt is set this far in the past instead of
 * cleared: pushes resume at once, and lastViewingAt + window still gives the
 * moment the user left, which the sidebar's new-response mark compares with.
 */
export const VIEWING_WINDOW_SECONDS = 45;

export function leftViewingAt(now: Date): Date {
  return new Date(now.getTime() - VIEWING_WINDOW_SECONDS * 1000);
}
