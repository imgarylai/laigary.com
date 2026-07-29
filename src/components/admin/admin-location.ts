import type { FileRouteTypes } from "@/routeTree.gen";

/** Every route under /admin, straight from the generated route tree. */
export type AdminRoutePath = Extract<FileRouteTypes["fullPaths"], `/admin${string}`>;

/**
 * The breadcrumb label for each admin route, as an i18n key.
 *
 * Exhaustive by type, which is the whole point. The version this replaces was a
 * hand-written map of path strings that silently stopped matching when the
 * routes moved in #53: it still listed `/admin/new` and `/admin/edit/`, while
 * the real routes had become `/admin/posts/new` and `/admin/posts/$postId/edit`.
 * Nothing failed — the two most-used pages in the admin just rendered a blank
 * breadcrumb (#178). Keyed on `Record<AdminRoutePath, …>`, the same mistake is
 * now a typecheck error.
 *
 * `/admin` is the layout route and never the leaf; `/admin/` is the dashboard
 * index that actually renders. Both are listed because both exist in the tree.
 */
export const ADMIN_BREADCRUMB_KEYS: Record<AdminRoutePath, string> = {
  "/admin": "admin.dashboard",
  "/admin/": "admin.dashboard",
  "/admin/posts/": "admin.posts",
  "/admin/posts/new": "admin.newPost",
  "/admin/posts/$postId/edit": "admin.editPost",
  "/admin/works/": "admin.works",
  "/admin/works/new": "admin.newWork",
  "/admin/works/$workId/edit": "admin.editWork",
  "/admin/pages/": "admin.pages",
  "/admin/pages/new": "admin.newPage",
  "/admin/pages/$slug/edit": "admin.editPage",
  "/admin/interview/": "admin.interview",
  "/admin/interview/sections": "admin.interviewSections",
  "/admin/interview/notes/": "admin.interviewNotes",
  "/admin/interview/notes/new": "admin.newNote",
  "/admin/interview/notes/$noteId/edit": "admin.editNote",
  "/admin/tags": "admin.tags",
  "/admin/settings": "admin.settings",
};

/**
 * The i18n key for the route being viewed, given the matched route's full path
 * — the pattern (`/admin/posts/$postId/edit`), not the concrete URL. Matching on
 * the pattern is what stops this drifting again: a renamed route changes the
 * pattern, and the map above will not compile until it is updated too.
 */
export function breadcrumbKeyFor(fullPath: string | undefined): string | undefined {
  if (!fullPath) return undefined;
  return ADMIN_BREADCRUMB_KEYS[fullPath as AdminRoutePath];
}

/**
 * Whether a sidebar section is the one being viewed.
 *
 * Prefix, not equality. The editors live *under* their section
 * (`/admin/posts/$postId/edit`), and with `pathname === href` the section went
 * dark the moment you opened one — so between this and the blank breadcrumb the
 * editor gave no indication of where you were in the admin (#179).
 *
 * Two things the naive prefix gets wrong, both handled here: `/admin` is a
 * prefix of every admin route, so Dashboard would never go out; and a bare
 * `startsWith` would light "Pages" on a hypothetical `/admin/pages-archive`,
 * hence the trailing separator.
 */
export function isSectionActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
