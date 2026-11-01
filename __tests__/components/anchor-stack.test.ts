import { closeAnchor, toggleAnchor, isSelfOrNested } from "@/components/response/AnchorPreview/anchorStackOps";
import type { AnchorInfo } from "@/lib/tom";

const info = (source: string, start: number, end?: number): AnchorInfo => ({
  boardId: "tuna",
  threadId: 1,
  start,
  end,
  sourceResponseId: source,
});
const item = (source: string, start: number) => ({ info: info(source, start), tag: `${source}@${start}` });
const create = (i: AnchorInfo) => ({ info: i, tag: `${i.sourceResponseId}@${i.start}` });
const tags = (stack: { tag: string }[]) => stack.map((s) => s.tag);

// main:r1 and main:r2 are two responses on the page; anchor:main:r1:a5 is a
// preview opened from inside r1's preview (showing response a5)
const r1 = "main:r1";
const r2 = "main:r2";
const nestedInR1 = "anchor:main:r1:a5";
const nestedInNested = "anchor:anchor:main:r1:a5:a7";

describe("anchor stack", () => {
  it("recognises nested previews by key", () => {
    expect(isSelfOrNested(nestedInR1, r1)).toBe(true);
    expect(isSelfOrNested(nestedInNested, r1)).toBe(true);
    expect(isSelfOrNested(r2, r1)).toBe(false);
  });

  it("closing one preview keeps previews from other responses", () => {
    const stack = [item(r1, 5), item(r2, 9)];
    expect(tags(closeAnchor(stack, r1))).toEqual([`${r2}@9`]);
  });

  it("closing a preview also closes what was opened inside it", () => {
    const stack = [item(r1, 5), item(nestedInR1, 7), item(r2, 9), item(nestedInNested, 8)];
    expect(tags(closeAnchor(stack, r1))).toEqual([`${r2}@9`]);
  });

  it("clicking the same anchor again closes only that preview", () => {
    const stack = [item(r1, 5), item(r2, 9)];
    expect(tags(toggleAnchor(stack, info(r1, 5), create))).toEqual([`${r2}@9`]);
  });

  it("another anchor in the same response replaces it and closes its nested previews", () => {
    const stack = [item(r1, 5), item(nestedInR1, 7), item(r2, 9)];
    expect(tags(toggleAnchor(stack, info(r1, 6), create))).toEqual([`${r1}@6`, `${r2}@9`]);
  });

  it("a new anchor opens alongside the others", () => {
    const stack = [item(r1, 5)];
    expect(tags(toggleAnchor(stack, info(r2, 9), create))).toEqual([`${r1}@5`, `${r2}@9`]);
  });
});
