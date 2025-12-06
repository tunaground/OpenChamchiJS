import { ResponseRangeType } from "@/lib/services/response";

export type ParsedRange =
  | { valid: true; range: ResponseRangeType }
  | { valid: false };

/**
 * Parse range parameter from URL
 * - undefined or [] → all responses
 * - ["recent"] → recent responses (limit by responsesPerPage)
 * - ["5"] → single response seq 5
 * - ["5", "10"] → range from seq 5 to 10 (URL: /trace/board/thread/5/10)
 */
export function parseRangeParam(
  rangeParam: string[] | undefined,
  responsesPerPage: number
): ParsedRange {
  // No range param → all responses
  if (!rangeParam || rangeParam.length === 0) {
    return { valid: true, range: { type: "all" } };
  }

  const [first, second] = rangeParam;

  // "recent" → latest responses
  if (first === "recent") {
    return { valid: true, range: { type: "recent", limit: responsesPerPage } };
  }

  // Check for range format with two path segments: ["start", "end"]
  if (second !== undefined) {
    const startSeq = parseInt(first, 10);
    const endSeq = parseInt(second, 10);

    if (isNaN(startSeq) || isNaN(endSeq) || startSeq < 0 || endSeq < startSeq) {
      return { valid: false };
    }

    return { valid: true, range: { type: "range", startSeq, endSeq } };
  }

  // Single seq number
  const seq = parseInt(first, 10);
  if (isNaN(seq) || seq < 0) {
    return { valid: false };
  }

  return { valid: true, range: { type: "single", seq } };
}
