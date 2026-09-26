export interface ResponseFilter {
  usernames?: string[];
  authorIds?: string[];
}

/**
 * Serialize a response filter into a query string (without leading "?").
 * Returns "" when the filter has no values. `filterActive=false` is appended
 * only when a filter exists and is inactive (the default is active).
 */
export function buildFilterQuery(
  filter: ResponseFilter | undefined,
  filterActive: boolean
): string {
  const params = new URLSearchParams();
  filter?.usernames?.forEach((u) => params.append("username", u));
  filter?.authorIds?.forEach((a) => params.append("authorId", a));
  if (params.size === 0) {
    return "";
  }
  if (!filterActive) {
    params.set("filterActive", "false");
  }
  return params.toString();
}

/**
 * Build a thread page URL for the given view ("all", "recent", "5", "5/10"),
 * preserving the response filter as query parameters.
 */
export function buildTraceUrl(
  boardId: string,
  threadId: number,
  view: string,
  filter?: ResponseFilter,
  filterActive: boolean = true
): string {
  const base = `/trace/${boardId}/${threadId}`;
  const path = view === "all" ? base : `${base}/${view}`;
  const query = buildFilterQuery(filter, filterActive);
  return query ? `${path}?${query}` : path;
}
