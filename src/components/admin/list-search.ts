// Search-param schemas for the admin list routes. Filters live in the URL so
// that navigating into an item and back (or reloading / sharing the URL)
// restores the filtered view instead of resetting it.

export interface ListSearch {
  q?: string;
  // 1-based page number. Omitted for page 1 so the default view keeps a clean
  // URL; only pages ≥ 2 are persisted (so a reload lands on the same page).
  page?: number;
}

export function parseListSearch(search: Record<string, unknown>): ListSearch {
  const q = typeof search.q === "string" && search.q !== "" ? search.q : undefined;
  const pageNum = Number(search.page);
  const page = Number.isInteger(pageNum) && pageNum > 1 ? pageNum : undefined;
  return { q, page };
}

/**
 * `ListSearch` plus the sort column, for lists that filter and sort in SQL
 * rather than in the browser.
 *
 * A client-side table can keep its sort in component state, because it holds
 * every row already. Once the server picks the page, the sort decides WHICH
 * rows come back, so it has to travel with the query — which means the URL, so
 * that the loader re-runs when it changes and a reload restores the same view.
 */
export interface SortedListSearch extends ListSearch {
  sort?: string;
  dir?: "asc" | "desc";
}

export function parseSortedListSearch(search: Record<string, unknown>): SortedListSearch {
  // The column id is not validated here — the server maps unknown ids back to
  // its default ordering, so a stale or hand-edited `?sort=` degrades to the
  // default view instead of throwing on a route that is otherwise fine.
  const sort = typeof search.sort === "string" && search.sort !== "" ? search.sort : undefined;
  const dir = search.dir === "asc" || search.dir === "desc" ? search.dir : undefined;
  return { ...parseListSearch(search), sort, dir: sort ? dir : undefined };
}
