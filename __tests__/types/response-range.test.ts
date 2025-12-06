import { parseRangeParam } from "@/lib/types/response-range";

describe("response-range", () => {
  describe("parseRangeParam", () => {
    const responsesPerPage = 50;

    describe("all responses", () => {
      it("returns all range when rangeParam is undefined", () => {
        const result = parseRangeParam(undefined, responsesPerPage);
        expect(result).toEqual({ valid: true, range: { type: "all" } });
      });

      it("returns all range when rangeParam is empty array", () => {
        const result = parseRangeParam([], responsesPerPage);
        expect(result).toEqual({ valid: true, range: { type: "all" } });
      });
    });

    describe("recent responses", () => {
      it("returns recent range for 'recent' param", () => {
        const result = parseRangeParam(["recent"], responsesPerPage);
        expect(result).toEqual({
          valid: true,
          range: { type: "recent", limit: 50 },
        });
      });

      it("uses responsesPerPage for limit", () => {
        const result = parseRangeParam(["recent"], 100);
        expect(result).toEqual({
          valid: true,
          range: { type: "recent", limit: 100 },
        });
      });
    });

    describe("single response", () => {
      it("returns single range for numeric param", () => {
        const result = parseRangeParam(["5"], responsesPerPage);
        expect(result).toEqual({
          valid: true,
          range: { type: "single", seq: 5 },
        });
      });

      it("handles seq 0", () => {
        const result = parseRangeParam(["0"], responsesPerPage);
        expect(result).toEqual({
          valid: true,
          range: { type: "single", seq: 0 },
        });
      });

      it("returns invalid for negative seq", () => {
        const result = parseRangeParam(["-1"], responsesPerPage);
        expect(result).toEqual({ valid: false });
      });

      it("returns invalid for non-numeric param", () => {
        const result = parseRangeParam(["abc"], responsesPerPage);
        expect(result).toEqual({ valid: false });
      });
    });

    describe("range responses", () => {
      it("returns range for two numeric params", () => {
        const result = parseRangeParam(["5", "10"], responsesPerPage);
        expect(result).toEqual({
          valid: true,
          range: { type: "range", startSeq: 5, endSeq: 10 },
        });
      });

      it("handles range starting from 0", () => {
        const result = parseRangeParam(["0", "100"], responsesPerPage);
        expect(result).toEqual({
          valid: true,
          range: { type: "range", startSeq: 0, endSeq: 100 },
        });
      });

      it("handles same start and end", () => {
        const result = parseRangeParam(["5", "5"], responsesPerPage);
        expect(result).toEqual({
          valid: true,
          range: { type: "range", startSeq: 5, endSeq: 5 },
        });
      });

      it("returns invalid when start > end", () => {
        const result = parseRangeParam(["10", "5"], responsesPerPage);
        expect(result).toEqual({ valid: false });
      });

      it("returns invalid for negative start", () => {
        const result = parseRangeParam(["-1", "5"], responsesPerPage);
        expect(result).toEqual({ valid: false });
      });

      it("returns invalid for non-numeric start", () => {
        const result = parseRangeParam(["abc", "10"], responsesPerPage);
        expect(result).toEqual({ valid: false });
      });

      it("returns invalid for non-numeric end", () => {
        const result = parseRangeParam(["5", "xyz"], responsesPerPage);
        expect(result).toEqual({ valid: false });
      });
    });
  });
});
