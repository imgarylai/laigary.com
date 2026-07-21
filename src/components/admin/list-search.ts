// Search-param schemas for the admin list routes. Filters live in the URL so
// that navigating into an item and back (or reloading / sharing the URL)
// restores the filtered view instead of resetting it.

export interface ListSearch {
  q?: string;
}

export function parseListSearch(search: Record<string, unknown>): ListSearch {
  const q = typeof search.q === "string" && search.q !== "" ? search.q : undefined;
  return { q };
}
