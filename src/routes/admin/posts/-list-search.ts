// Posts-specific search params, colocated with the route that validates them
// (the `-` prefix keeps the file out of the generated route tree). The shared
// `q`-only schema lives in components/admin/list-search.ts.
import { parseListSearch, type ListSearch } from "@/components/admin/list-search";

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export interface PostsListSearch extends ListSearch {
  status?: PostStatus;
}

export function parsePostsListSearch(search: Record<string, unknown>): PostsListSearch {
  const status = POST_STATUSES.find((s) => s === search.status);
  return { ...parseListSearch(search), status };
}
