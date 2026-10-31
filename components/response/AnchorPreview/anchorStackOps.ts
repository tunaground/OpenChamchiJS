import type { AnchorInfo } from "@/lib/tom";

// Pure updates for the anchor preview stack. Every open preview is keyed by
// the response that holds its anchor (sourceResponseId). A preview opened from
// inside another preview gets the key `anchor:{parentKey}:{responseId}`, so a
// preview's nested children are the items whose key contains `anchor:{key}:`.
// Previews opened from other responses are independent and must survive.

interface StackItem {
  info: AnchorInfo;
}

/** True for the preview keyed `key` and every preview nested inside it */
export function isSelfOrNested(itemKey: string | undefined, key: string): boolean {
  if (!itemKey) return false;
  return itemKey === key || itemKey.includes(`anchor:${key}:`);
}

/** Drop one preview and the previews opened inside it; leave the rest */
export function closeAnchor<T extends StackItem>(stack: T[], key: string): T[] {
  return stack.filter((item) => !isSelfOrNested(item.info.sourceResponseId, key));
}

function sameTarget(a: AnchorInfo, b: AnchorInfo): boolean {
  return a.boardId === b.boardId && a.threadId === b.threadId && a.start === b.start && a.end === b.end;
}

/**
 * Click on an anchor:
 * - the same anchor again closes its preview (and what is nested in it)
 * - another anchor in the same response replaces the preview; its nested
 *   previews belonged to the old content, so they close
 * - otherwise a new preview opens
 */
export function toggleAnchor<T extends StackItem>(
  stack: T[],
  info: AnchorInfo,
  create: (info: AnchorInfo, previous?: T) => T
): T[] {
  const key = info.sourceResponseId ?? "";
  const existing = stack.find((item) => item.info.sourceResponseId === key);
  if (!existing) return [...stack, create(info)];
  if (sameTarget(existing.info, info)) return closeAnchor(stack, key);

  return stack
    .filter((item) => item === existing || !isSelfOrNested(item.info.sourceResponseId, key))
    .map((item) => (item === existing ? create(info, existing) : item));
}
