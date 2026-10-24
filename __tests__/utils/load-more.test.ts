import { getInitialLoadedFromSeq, getNextLoadedFromSeq, getDisplayedLastSeq, getRefreshRange } from "@/lib/utils/load-more";

describe("load-more", () => {
  describe("getInitialLoadedFromSeq", () => {
    it("returns null for the 'all' view (nothing left to load)", () => {
      expect(getInitialLoadedFromSeq("all", [{ seq: 0 }, { seq: 5 }])).toBeNull();
    });

    it("uses the lowest non-zero loaded seq for the 'recent' view", () => {
      expect(getInitialLoadedFromSeq("recent", [{ seq: 0 }, { seq: 7 }, { seq: 9 }])).toBe(7);
    });

    it("returns null for 'recent' when only the thread body is loaded", () => {
      expect(getInitialLoadedFromSeq("recent", [{ seq: 0 }])).toBeNull();
    });

    it("uses the range start for a 'start/end' view even if filtered results start later", () => {
      expect(getInitialLoadedFromSeq("5/10", [{ seq: 0 }, { seq: 8 }])).toBe(5);
    });

    it("uses the seq for a single view", () => {
      expect(getInitialLoadedFromSeq("5", [{ seq: 0 }, { seq: 5 }])).toBe(5);
    });
  });

  describe("getNextLoadedFromSeq", () => {
    it("moves the bound to the lowest fetched non-zero seq when a full page came back", () => {
      expect(getNextLoadedFromSeq([{ seq: 0 }, { seq: 4 }, { seq: 6 }], 2)).toBe(4);
    });

    it("moves the bound to 1 when fewer than requested came back", () => {
      expect(getNextLoadedFromSeq([{ seq: 0 }, { seq: 4 }], 10)).toBe(1);
      expect(getNextLoadedFromSeq([], 10)).toBe(1);
    });
  });

  describe("getDisplayedLastSeq", () => {
    it("returns the highest seq on screen", () => {
      expect(getDisplayedLastSeq([{ seq: 0 }, { seq: 7 }, { seq: 12 }, { seq: 9 }])).toBe(12);
    });

    it("returns 0 when only the thread body is shown", () => {
      expect(getDisplayedLastSeq([{ seq: 0 }])).toBe(0);
    });

    it("returns 0 when nothing is shown", () => {
      expect(getDisplayedLastSeq([])).toBe(0);
    });
  });

  describe("getRefreshRange", () => {
    it("reaches the board's reply limit in one request", () => {
      expect(getRefreshRange(1200, 5000)).toEqual({ startSeq: 1201, endSeq: 5000 });
    });

    it("never ends before it starts", () => {
      expect(getRefreshRange(5000, 5000)).toEqual({ startSeq: 5001, endSeq: 5001 });
    });
  });
});
