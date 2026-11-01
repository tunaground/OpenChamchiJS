import { parseTraceRange, getPrevRange, getNextRange, isAtLatestRange } from "@/lib/utils/trace-range";

describe("trace-range", () => {
  describe("parseTraceRange", () => {
    it("returns null for all and recent", () => {
      expect(parseTraceRange("all")).toBeNull();
      expect(parseTraceRange("recent")).toBeNull();
    });

    it("parses a range and a single seq", () => {
      expect(parseTraceRange("5/10")).toEqual({ start: 5, end: 10 });
      expect(parseTraceRange("7")).toEqual({ start: 7, end: 7 });
    });
  });

  describe("getPrevRange", () => {
    it("goes to the first page from all", () => {
      expect(getPrevRange("all", 131, 50)).toBe("1/50");
    });

    it("goes to the page before the latest from recent", () => {
      // latest page starts at 82, so the one before starts at 32
      expect(getPrevRange("recent", 131, 50)).toBe("32/81");
    });

    it("is null when recent already covers the start", () => {
      expect(getPrevRange("recent", 30, 50)).toBeNull();
    });

    it("steps back one page and clamps at 1", () => {
      expect(getPrevRange("101/150", 200, 50)).toBe("51/100");
      expect(getPrevRange("20/69", 200, 50)).toBe("1/50");
    });

    it("is null on the first page", () => {
      expect(getPrevRange("1/50", 200, 50)).toBeNull();
    });
  });

  describe("getNextRange", () => {
    it("goes to the latest page from all or recent", () => {
      expect(getNextRange("all", 131, 50)).toBe("82/131");
      expect(getNextRange("recent", 131, 50)).toBe("82/131");
    });

    it("steps forward one page", () => {
      expect(getNextRange("1/50", 200, 50)).toBe("51/100");
    });

    it("stays on the latest page at the end", () => {
      expect(getNextRange("82/131", 131, 50)).toBe("82/131");
    });

    it("keeps a full-size range past lastSeq", () => {
      expect(getNextRange("51/100", 120, 50)).toBe("101/150");
    });
  });

  describe("isAtLatestRange", () => {
    it("is true for all, recent and a range reaching lastSeq", () => {
      expect(isAtLatestRange("all", 131)).toBe(true);
      expect(isAtLatestRange("recent", 131)).toBe(true);
      expect(isAtLatestRange("82/131", 131)).toBe(true);
    });

    it("is false for an earlier range", () => {
      expect(isAtLatestRange("1/50", 131)).toBe(false);
    });
  });
});
