export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const DEFAULT_USER_LIMIT = 20;
export const MAX_LIMIT = 100;

export function normalizePaginationParams(params: PaginationParams): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const limit = Math.max(1, Math.min(MAX_LIMIT, params.limit ?? DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export interface QueryPaginationParams extends PaginationParams {
  search?: string;
}

/**
 * Parse pagination and search params from URLSearchParams
 */
export function parsePaginationQuery(
  searchParams: URLSearchParams,
  defaults?: { limit?: number }
): QueryPaginationParams {
  const pageStr = searchParams.get("page");
  const limitStr = searchParams.get("limit");
  const search = searchParams.get("search") || undefined;

  const page = pageStr ? parseInt(pageStr, 10) : undefined;
  const limit = limitStr ? parseInt(limitStr, 10) : defaults?.limit;

  return { page, limit, search };
}
