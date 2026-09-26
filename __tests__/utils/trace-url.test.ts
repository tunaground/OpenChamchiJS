import { buildFilterQuery, buildTraceUrl } from "@/lib/utils/trace-url";

describe("trace-url", () => {
  describe("buildFilterQuery", () => {
    it("returns empty string when there is no filter", () => {
      expect(buildFilterQuery(undefined, true)).toBe("");
      expect(buildFilterQuery({}, true)).toBe("");
      expect(buildFilterQuery({ usernames: [], authorIds: [] }, true)).toBe("");
    });

    it("serializes usernames and authorIds as repeated params", () => {
      expect(
        buildFilterQuery({ usernames: ["a", "b"], authorIds: ["x"] }, true)
      ).toBe("username=a&username=b&authorId=x");
    });

    it("appends filterActive=false only when inactive", () => {
      expect(buildFilterQuery({ usernames: ["a"] }, false)).toBe(
        "username=a&filterActive=false"
      );
      expect(buildFilterQuery({ usernames: ["a"] }, true)).toBe("username=a");
    });

    it("omits filterActive when there is no filter even if inactive", () => {
      expect(buildFilterQuery(undefined, false)).toBe("");
    });

    it("url-encodes values", () => {
      expect(buildFilterQuery({ usernames: ["a b&c"] }, true)).toBe(
        "username=a+b%26c"
      );
    });
  });

  describe("buildTraceUrl", () => {
    it("omits the range segment for the all view", () => {
      expect(buildTraceUrl("board", 7, "all")).toBe("/trace/board/7");
    });

    it("keeps recent, single, and range views", () => {
      expect(buildTraceUrl("board", 7, "recent")).toBe("/trace/board/7/recent");
      expect(buildTraceUrl("board", 7, "5")).toBe("/trace/board/7/5");
      expect(buildTraceUrl("board", 7, "5/10")).toBe("/trace/board/7/5/10");
    });

    it("appends the filter query to the current view", () => {
      expect(
        buildTraceUrl("board", 7, "5/10", { usernames: ["a"], authorIds: ["x"] }, true)
      ).toBe("/trace/board/7/5/10?username=a&authorId=x");
      expect(
        buildTraceUrl("board", 7, "all", { authorIds: ["x"] }, false)
      ).toBe("/trace/board/7?authorId=x&filterActive=false");
    });

    it("produces no query string when the filter is empty", () => {
      expect(buildTraceUrl("board", 7, "recent", { usernames: [] }, true)).toBe(
        "/trace/board/7/recent"
      );
    });
  });
});
