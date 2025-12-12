/**
 * Archive Utilities
 */

/**
 * Format date string for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Parse slug parameter to get highlighted sequences
 * Supports: "5" (single), "5-10" (range)
 */
export function parseSlugToHighlightSeqs(slug: string[] | undefined): number[] {
  if (!slug || slug.length === 0) return [];

  const seqParam = slug[0];
  const seqs: number[] = [];

  // Check for range (e.g., "5-10")
  if (seqParam.includes("-")) {
    const [start, end] = seqParam.split("-").map((s) => parseInt(s, 10));
    if (!isNaN(start) && !isNaN(end)) {
      for (let i = start; i <= end; i++) {
        seqs.push(i);
      }
    }
  } else {
    // Single sequence
    const seq = parseInt(seqParam, 10);
    if (!isNaN(seq)) {
      seqs.push(seq);
    }
  }

  return seqs;
}

/**
 * Extract YouTube video ID from URL or return as-is if already an ID
 */
export function extractYoutubeId(input: string): string | null {
  if (!input) return null;

  // Already a video ID (11 characters, alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Try to extract from various URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  return null;
}
