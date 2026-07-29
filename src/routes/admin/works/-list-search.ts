// Works-specific search params, colocated with the route that validates them
// (the `-` prefix keeps the file out of the generated route tree). The shared
// `q`-only schema lives in components/admin/list-search.ts.
import { parseListSearch, type ListSearch } from "@/components/admin/list-search";

export const WORK_STATUSES = ["draft", "published"] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export interface WorksListSearch extends ListSearch {
  status?: WorkStatus;
}

export function parseWorksListSearch(search: Record<string, unknown>): WorksListSearch {
  const status = WORK_STATUSES.find((s) => s === search.status);
  return { ...parseListSearch(search), status };
}
