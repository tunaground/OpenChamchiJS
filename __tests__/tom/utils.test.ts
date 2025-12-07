import { toOriginalFormat } from "@/lib/tom/utils";

describe("TOM Utils", () => {
  describe("toOriginalFormat", () => {
    it("converts dice with result back to original format", () => {
      const dbContent = "[dice 1 6]3[/dice]";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("[dice 1 6]");
    });

    it("handles dice with different numbers", () => {
      const dbContent = "[dice 1 20]15[/dice]";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("[dice 1 20]");
    });

    it("preserves text around dice", () => {
      const dbContent = "Roll: [dice 1 6]3[/dice] was rolled";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("Roll: [dice 1 6] was rolled");
    });

    it("handles multiple dice", () => {
      const dbContent = "[dice 1 6]2[/dice] + [dice 1 6]5[/dice]";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("[dice 1 6] + [dice 1 6]");
    });

    it("preserves other tags unchanged", () => {
      const dbContent = "[bld]bold[/bld] text";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("[bld]bold[/bld] text");
    });

    it("handles self-closing tags", () => {
      const dbContent = "[hr]";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("[hr]");
    });

    it("handles youtube tag", () => {
      const dbContent = "[youtube https://youtube.com/watch?v=abc]";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("[youtube https://youtube.com/watch?v=abc]");
    });

    it("handles nested tags with dice", () => {
      const dbContent = "[bld][dice 1 6]4[/dice][/bld]";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("[bld][dice 1 6][/bld]");
    });

    it("handles calc tags unchanged", () => {
      const dbContent = "[calc (+ 1 2 3)][/calc]";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("[calc (+ 1 2 3)][/calc]");
    });

    it("handles calcn tags unchanged", () => {
      const dbContent = "[calcn 1+2*3][/calcn]";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("[calcn 1+2*3][/calcn]");
    });

    it("handles plain text", () => {
      const dbContent = "just plain text";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe("just plain text");
    });

    it("handles empty string", () => {
      const original = toOriginalFormat("");
      expect(original).toBe("");
    });

    it("returns original content on parse error", () => {
      // This should not throw, just return the content as-is
      const malformed = "[unclosed";
      const original = toOriginalFormat(malformed);
      expect(typeof original).toBe("string");
    });

    it("handles complex content", () => {
      const dbContent =
        "[bld]Title[/bld]\n[dice 1 20]18[/dice]\n[clr red]colored[/clr]";
      const original = toOriginalFormat(dbContent);
      expect(original).toBe(
        "[bld]Title[/bld]\n[dice 1 20]\n[clr red]colored[/clr]"
      );
    });
  });
});
