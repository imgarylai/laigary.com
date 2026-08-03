import type { FileRouteTypes } from "@/routeTree.gen";
import { defaultLocale, getTranslation } from "@/i18n";

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
 * The slice of a route's `head()` context this module needs. Structural on
 * purpose: the real `RouteMatch` generics differ per route, and all a title
 * needs is the leaf's route *pattern*.
 */
export type AdminHeadCtx = { match: { fullPath: string } };

/** Separates the segments of an admin tab title. */
const TITLE_SEP = " · ";

/**
 * The browser-tab title for an admin page: `<subject> · <section> · Admin`,
 * e.g. `Hello World · Edit Post · Admin`.
 *
 * Subject first so a row of pinned tabs stays readable — browsers truncate the
 * tail, and with the section first every open editor would read `Edit Post…`,
 * which is the "every tab just says Admin" problem one level down. `subject` is
 * the entity being edited; list and "new" pages have none and drop the segment,
 * as does an untitled draft.
 *
 * The section label comes from the same map the header breadcrumb uses, so a
 * renamed route updates both or neither.
 *
 * Always in the default locale, like every other title in the app. `head()`
 * runs outside React, so there is no i18n context to read, and the request
 * locale is not reachable either: the router hands `head()` the *live* leaf
 * match but only pre-load snapshots of its ancestors, so the root loader's
 * resolved locale reads back as undefined there.
 */
export function adminPageTitle(ctx: AdminHeadCtx, subject?: string | null): string {
  const key = breadcrumbKeyFor(ctx.match.fullPath);
  return [
    subject?.trim(),
    key ? getTranslation(defaultLocale, key) : undefined,
    getTranslation(defaultLocale, "admin.admin"),
  ]
    .filter(Boolean)
    .join(TITLE_SEP);
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
