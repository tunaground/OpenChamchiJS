import { getImageLabel } from "@/lib/push/messages";

describe("getImageLabel", () => {
  it("returns the English label for en", () => {
    expect(getImageLabel("en")).toBe("(image)");
  });

  it("returns the Japanese label for ja", () => {
    expect(getImageLabel("ja")).toBe("(画像)");
  });

  it.each(["xx", null])("falls back to Korean for %p", (locale) => {
    expect(getImageLabel(locale)).toBe("(이미지)");
  });
});
