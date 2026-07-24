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
