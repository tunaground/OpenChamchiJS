import {
  normalizePaginationParams,
  createPaginatedResult,
  parsePaginationQuery,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "@/lib/types/pagination";

describe("pagination", () => {
  describe("normalizePaginationParams", () => {
    it("returns defaults when no params provided", () => {
      const result = normalizePaginationParams({});
      expect(result.page).toBe(DEFAULT_PAGE);
      expect(result.limit).toBe(DEFAULT_LIMIT);
      expect(result.offset).toBe(0);
    });

    it("calculates offset correctly", () => {
      const result = normalizePaginationParams({ page: 3, limit: 10 });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20); // (3-1) * 10
    });

    it("enforces minimum page of 1", () => {
      const result = normalizePaginationParams({ page: 0 });
      expect(result.page).toBe(1);

      const result2 = normalizePaginationParams({ page: -5 });
      expect(result2.page).toBe(1);
    });

    it("enforces minimum limit of 1", () => {
      const result = normalizePaginationParams({ limit: 0 });
      expect(result.limit).toBe(1);

      const result2 = normalizePaginationParams({ limit: -10 });
      expect(result2.limit).toBe(1);
    });

    it("enforces maximum limit", () => {
      const result = normalizePaginationParams({ limit: 500 });
      expect(result.limit).toBe(MAX_LIMIT);
    });

    it("allows limit within range", () => {
      const result = normalizePaginationParams({ limit: 50 });
      expect(result.limit).toBe(50);
    });
  });

  describe("createPaginatedResult", () => {
    it("creates correct pagination metadata", () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = createPaginatedResult(data, 25, 1, 10);

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3); // ceil(25/10)
    });

    it("calculates totalPages correctly with exact division", () => {
      const result = createPaginatedResult([], 20, 1, 10);
      expect(result.pagination.totalPages).toBe(2);
    });

    it("calculates totalPages correctly with remainder", () => {
      const result = createPaginatedResult([], 21, 1, 10);
      expect(result.pagination.totalPages).toBe(3);
    });

    it("handles zero total", () => {
      const result = createPaginatedResult([], 0, 1, 10);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("preserves data array", () => {
      const data = [{ name: "a" }, { name: "b" }];
      const result = createPaginatedResult(data, 2, 1, 10);
      expect(result.data).toBe(data);
    });
  });

  describe("parsePaginationQuery", () => {
    it("parses page and limit from URLSearchParams", () => {
      const params = new URLSearchParams("page=2&limit=30");
      const result = parsePaginationQuery(params);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(30);
    });

    it("parses search param", () => {
      const params = new URLSearchParams("search=hello");
      const result = parsePaginationQuery(params);

      expect(result.search).toBe("hello");
    });

    it("returns undefined for missing params", () => {
      const params = new URLSearchParams("");
      const result = parsePaginationQuery(params);

      expect(result.page).toBeUndefined();
      expect(result.limit).toBeUndefined();
      expect(result.search).toBeUndefined();
    });

    it("uses default limit when provided", () => {
      const params = new URLSearchParams("");
      const result = parsePaginationQuery(params, { limit: 50 });

      expect(result.limit).toBe(50);
    });

    it("overrides default limit with query param", () => {
      const params = new URLSearchParams("limit=25");
      const result = parsePaginationQuery(params, { limit: 50 });

      expect(result.limit).toBe(25);
    });

    it("returns undefined search for empty string", () => {
      const params = new URLSearchParams("search=");
      const result = parsePaginationQuery(params);

      expect(result.search).toBeUndefined();
    });
  });
});
