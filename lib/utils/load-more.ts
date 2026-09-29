/**
 * Helpers for the thread page "load more" button.
 *
 * `loadedFromSeq` is the lower bound (inclusive) of the seq range that has
 * already been covered, either by the initial view or by previous loads.
 * Everything at or above it has been fetched (and filtered, when a focus
 * filter is active), so "load more" only needs to look below it.
 */

interface HasSeq {
  seq: number;
}

function minNonZeroSeq(responses: HasSeq[]): number | null {
  const seqs = responses.filter((r) => r.seq > 0).map((r) => r.seq);
  return seqs.length > 0 ? Math.min(...seqs) : null;
}

/**
 * Initial bound derived from the current view ("all", "recent", "5", "5/10")
 * and the responses rendered for it. Returns null when there is nothing more
 * to load (the "all" view, or "recent" with only the thread body).
 */
export function getInitialLoadedFromSeq(
  currentView: string,
  responses: HasSeq[]
): number | null {
  if (currentView === "all") {
    return null;
  }
  if (currentView === "recent") {
    return minNonZeroSeq(responses);
  }
  const start = parseInt(currentView.split("/")[0], 10);
  return isNaN(start) ? minNonZeroSeq(responses) : start;
}

/**
 * Bound after a "load more" request that asked for `count` responses below
 * the previous bound. A short page means everything below was exhausted.
 */
export function getNextLoadedFromSeq(fetched: HasSeq[], count: number): number {
  const nonZero = fetched.filter((r) => r.seq > 0);
  if (nonZero.length < count) {
    return 1;
  }
  return Math.min(...nonZero.map((r) => r.seq));
}
