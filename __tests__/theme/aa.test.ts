import {
  AA_FONT_SIZE,
  AA_LINE_HEIGHT,
  AA_MOBILE_FONT_SIZE,
  AA_MOBILE_LINE_HEIGHT,
  aaMobileLineHeight,
} from "@/lib/theme/aa";

const rem = (value: string) => {
  expect(value).toMatch(/^\d+(\.\d+)?rem$/);
  return parseFloat(value);
};

describe("AA text metrics", () => {
  it("keeps the desktop size and line height", () => {
    expect(AA_FONT_SIZE).toBe("1.5rem");
    expect(AA_LINE_HEIGHT).toBe("1.6rem");
  });

  it("shrinks the font on mobile", () => {
    expect(AA_MOBILE_FONT_SIZE).toBe("1.125rem");
  });

  it("uses the desktop line-height ratio on mobile, on a whole-pixel line height", () => {
    expect(AA_MOBILE_LINE_HEIGHT).toBe("1.2rem");
    expect(rem(AA_MOBILE_LINE_HEIGHT) / rem(AA_MOBILE_FONT_SIZE)).toBeCloseTo(
      rem(AA_LINE_HEIGHT) / rem(AA_FONT_SIZE),
      6
    );
  });

  it("scales any desktop line height by the same factor", () => {
    // The archive draws AA at 1.8rem on desktop
    expect(aaMobileLineHeight("1.8rem")).toBe("1.35rem");
    expect(aaMobileLineHeight(AA_LINE_HEIGHT)).toBe(AA_MOBILE_LINE_HEIGHT);
  });
});
