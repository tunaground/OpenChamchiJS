import { getPushBody } from "@/lib/push/messages";

describe("getPushBody", () => {
  it("returns the English body for en", () => {
    expect(getPushBody("en")).toBe("There are new replies");
  });

  it("returns the Japanese body for ja", () => {
    expect(getPushBody("ja")).toBe("新しいレスがあります");
  });

  it.each(["xx", null])("falls back to Korean for %p", (locale) => {
    expect(getPushBody(locale)).toBe("새 답글이 있어요");
  });
});
