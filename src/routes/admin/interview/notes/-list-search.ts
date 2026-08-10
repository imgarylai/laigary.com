// Notes-specific search params, colocated with the route that validates them
// (the `-` prefix keeps the file out of the generated route tree). The shared
// `q`/`page`/`sort` schema lives in components/admin/list-search.ts.
import { parseSortedListSearch, type SortedListSearch } from "@/components/admin/list-search";

export const NOTE_STATUSES = ["draft", "published"] as const;
export type NoteStatus = (typeof NOTE_STATUSES)[number];

export interface NotesListSearch extends SortedListSearch {
  /** Section slug, not id — the URL stays readable and survives a reseed. */
  section?: string;
  status?: NoteStatus;
}

export function parseNotesListSearch(search: Record<string, unknown>): NotesListSearch {
  // The slug is not checked against the section table here (that table is not
  // reachable from a search-param parser); an unknown one degrades to the
  // unfiltered list on the server, the same way an unknown `?sort=` does.
  const section =
    typeof search.section === "string" && search.section !== "" ? search.section : undefined;
  const status = NOTE_STATUSES.find((s) => s === search.status);
  return { ...parseSortedListSearch(search), section, status };
}
