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

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export interface PostsListSearch extends ListSearch {
  status?: PostStatus;
}

export function parsePostsListSearch(search: Record<string, unknown>): PostsListSearch {
  const status = POST_STATUSES.find((s) => s === search.status);
  return { ...parseListSearch(search), status };
}
