import { toPushExcerpt } from "@/lib/push/plain-text";

const labels = { image: "(이미지)" };

describe("toPushExcerpt", () => {
  it("keeps plain text and anchors", () => {
    expect(toPushExcerpt("안녕 >>12 반가워", labels)).toBe("안녕 >>12 반가워");
  });

  it("shows dice results and styled text without markup", () => {
    expect(toPushExcerpt("굴림 [dice 1 6]3[/dice] [clr red]빨강[/clr] [bld]굵게[/bld]", labels)).toBe(
      "굴림 3 빨강 굵게"
    );
  });

  it("hides spoiler contents", () => {
    expect(toPushExcerpt("결말은 [spo]범인은 집사[/spo]", labels)).toBe("결말은 ▒▒▒");
  });

  it("replaces images, AA and YouTube with short markers", () => {
    expect(toPushExcerpt("[img https://x/y.png] [aa]  ∧_∧[/aa] [youtube abc]", labels)).toBe(
      "(이미지) (AA) (YouTube)"
    );
  });

  it("collapses whitespace and line breaks", () => {
    expect(toPushExcerpt("첫줄\n\n  둘째줄[hr]셋째줄", labels)).toBe("첫줄 둘째줄 셋째줄");
  });

  it("truncates to 100 characters with an ellipsis", () => {
    const result = toPushExcerpt("가".repeat(150), labels);
    expect(result).toBe(`${"가".repeat(100)}…`);
  });

  it("falls back to the raw text when markup cannot be parsed", () => {
    expect(toPushExcerpt("[clr red]닫히지 않은 태그", labels)).toContain("닫히지 않은 태그");
  });
});
