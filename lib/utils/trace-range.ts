// Previous/next page ranges for the thread view.
// currentView is "all", "recent", "N" (single response) or "N/M" (range);
// ranges are returned in the same "start/end" form.

export function parseTraceRange(currentView: string): { start: number; end: number } | null {
  if (currentView === "all" || currentView === "recent") {
    return null;
  }
  if (currentView.includes("/")) {
    const [start, end] = currentView.split("/").map(Number);
    return { start, end };
  }
  const seq = Number(currentView);
  if (!isNaN(seq)) {
    return { start: seq, end: seq };
  }
  return null;
}

/** The page before the current one, or null when already at the start */
export function getPrevRange(currentView: string, lastSeq: number, responsesPerPage: number): string | null {
  const currentRange = parseTraceRange(currentView);

  if (!currentRange) {
    if (currentView === "recent") {
      // Recent shows last page, so prev should go to the page before that
      const lastPageStart = Math.max(1, lastSeq - responsesPerPage + 1);
      const newStart = Math.max(1, lastPageStart - responsesPerPage);
      const newEnd = newStart + responsesPerPage - 1;
      // If we're already at the beginning, disable prev
      if (lastPageStart <= 1) {
        return null;
      }
      return `${newStart}/${newEnd}`;
    }
    // If viewing all, prev goes to first page
    return `1/${responsesPerPage}`;
  }

  const newStart = Math.max(1, currentRange.start - responsesPerPage);
  const newEnd = newStart + responsesPerPage - 1;

  // Can't go before 1
  if (currentRange.start <= 1) {
    return null;
  }

  return `${newStart}/${newEnd}`;
}

/** The page after the current one; the latest page when there is none */
export function getNextRange(currentView: string, lastSeq: number, responsesPerPage: number): string {
  const currentRange = parseTraceRange(currentView);

  if (!currentRange) {
    // If viewing all or recent, next goes to last page
    // seq 0 is thread body, responses start from seq 1
    const newStart = Math.max(1, lastSeq - responsesPerPage + 1);
    const newEnd = Math.max(newStart + responsesPerPage - 1, lastSeq);
    return `${newStart}/${newEnd}`;
  }

  const newStart = Math.max(1, currentRange.end + 1);
  const newEnd = newStart + responsesPerPage - 1;

  // If we're already at or past lastSeq, show the latest page
  if (currentRange.end >= lastSeq) {
    const latestStart = Math.max(1, lastSeq - responsesPerPage + 1);
    const latestEnd = Math.max(latestStart + responsesPerPage - 1, lastSeq);
    return `${latestStart}/${latestEnd}`;
  }

  // If newEnd exceeds lastSeq, cap it but ensure valid range
  if (newEnd > lastSeq) {
    return `${newStart}/${Math.max(newEnd, lastSeq)}`;
  }

  return `${newStart}/${newEnd}`;
}

/** True when the current range already reaches the last response */
export function isAtLatestRange(currentView: string, lastSeq: number): boolean {
  if (currentView === "all" || currentView === "recent") return true;
  const currentRange = parseTraceRange(currentView);
  return currentRange !== null && currentRange.end >= lastSeq;
}
