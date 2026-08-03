// The "where am I" logic behind the admin header and sidebar (#178, #179).
// Both were wrong in the same way — matching concrete path strings by hand —
// and between them the editor gave no indication of where you were.

import { describe, it, expect } from "vitest";
import { defaultLocale, getTranslation } from "@/i18n";
import {
  ADMIN_BREADCRUMB_KEYS,
  adminPageTitle,
  breadcrumbKeyFor,
  isSectionActive,
} from "@/components/admin/admin-location";

describe("breadcrumbKeyFor", () => {
  it.each([
    ["/admin/", "admin.dashboard"],
    ["/admin/posts/", "admin.posts"],
    ["/admin/posts/new", "admin.newPost"],
    ["/admin/posts/$postId/edit", "admin.editPost"],
    ["/admin/pages/", "admin.pages"],
    ["/admin/pages/new", "admin.newPage"],
    ["/admin/pages/$slug/edit", "admin.editPage"],
    ["/admin/interview/notes/", "admin.interviewNotes"],
    ["/admin/interview/notes/new", "admin.newNote"],
    ["/admin/interview/notes/$noteId/edit", "admin.editNote"],
    ["/admin/interview/sections", "admin.interviewSections"],
    ["/admin/tags", "admin.tags"],
    ["/admin/settings", "admin.settings"],
  ])("should label %s", (fullPath, key) => {
    expect(breadcrumbKeyFor(fullPath)).toBe(key);
  });

  it("should tell the two page routes apart", () => {
    // The old code checked `startsWith("/admin/pages/")`, which also matched
    // /admin/pages/new — so creating a page was labelled "Edit page".
    expect(breadcrumbKeyFor("/admin/pages/new")).toBe("admin.newPage");
    expect(breadcrumbKeyFor("/admin/pages/$slug/edit")).toBe("admin.editPage");
  });

  it("should label every route the editors live on", () => {
    // The two most-used pages in the admin, and the two the old map missed
    // entirely: it still listed the pre-#53 `/admin/new` and `/admin/edit/`.
    expect(breadcrumbKeyFor("/admin/posts/new")).toBeTruthy();
    expect(breadcrumbKeyFor("/admin/posts/$postId/edit")).toBeTruthy();
  });

  it("should return nothing for a path outside the admin", () => {
    expect(breadcrumbKeyFor("/posts/$slug")).toBeUndefined();
    expect(breadcrumbKeyFor(undefined)).toBeUndefined();
  });

  it("should give every admin route a label", () => {
    // The type makes this exhaustive at compile time; this catches an empty or
    // placeholder value slipping in, which the type cannot see.
    for (const [route, key] of Object.entries(ADMIN_BREADCRUMB_KEYS)) {
      expect(key, route).toMatch(/^admin\./);
    }
  });
});

describe("adminPageTitle", () => {
  /** The slice of a head() context a title is built from: the leaf's pattern. */
  const ctx = (fullPath: string) => ({ match: { fullPath } });

  it("should lead with the entity when editing one", () => {
    // Subject first is the whole point: browsers truncate the tail, so with the
    // section leading, every open editor tab would read "Edit Post…".
    expect(adminPageTitle(ctx("/admin/posts/$postId/edit"), "Hello World")).toBe(
      "Hello World · Edit Post · Admin",
    );
  });

  it("should name the section when there is no entity", () => {
    expect(adminPageTitle(ctx("/admin/posts/"))).toBe("Posts · Admin");
    expect(adminPageTitle(ctx("/admin/settings"))).toBe("Settings · Admin");
  });

  it("should drop the entity segment when a draft has no title yet", () => {
    // A brand-new post is saved untitled; " · · Admin" would be worse than the
    // plain section name.
    expect(adminPageTitle(ctx("/admin/posts/$postId/edit"), "   ")).toBe("Edit Post · Admin");
    expect(adminPageTitle(ctx("/admin/posts/$postId/edit"), null)).toBe("Edit Post · Admin");
  });

  it("should read its labels from the default locale's dictionary", () => {
    // Not the request locale: head() runs outside React, and the router gives it
    // pre-load snapshots of the ancestor matches, so the locale the root loader
    // resolved is not readable there. Hardcoding the copy here instead would
    // fork the labels from the ones the header renders.
    expect(adminPageTitle(ctx("/admin/interview/notes/"))).toBe(
      `${getTranslation(defaultLocale, "admin.interviewNotes")} · ${getTranslation(defaultLocale, "admin.admin")}`,
    );
  });

  it("should still identify the admin for a route with no label", () => {
    expect(adminPageTitle(ctx("/admin/somewhere-new"))).toBe("Admin");
  });
});

describe("isSectionActive", () => {
  it.each(["/admin/posts", "/admin/posts/new", "/admin/posts/abc123/edit"])(
    "should keep Posts lit on %s",
    (pathname) => {
      // The whole point: with the old `pathname === href` the section went dark
      // the moment you opened an editor.
      expect(isSectionActive(pathname, "/admin/posts")).toBe(true);
    },
  );

  it("should not light a section from a different one", () => {
    expect(isSectionActive("/admin/pages", "/admin/posts")).toBe(false);
    expect(isSectionActive("/admin/tags", "/admin/posts")).toBe(false);
  });

  it("should light Dashboard only on the dashboard", () => {
    // `/admin` is a prefix of every admin route, so a bare prefix match would
    // leave Dashboard permanently lit.
    expect(isSectionActive("/admin", "/admin")).toBe(true);
    expect(isSectionActive("/admin/", "/admin")).toBe(true);
    expect(isSectionActive("/admin/posts", "/admin")).toBe(false);
    expect(isSectionActive("/admin/settings", "/admin")).toBe(false);
  });

  it("should require a path separator, not a bare prefix", () => {
    // Otherwise "Pages" would light up on a sibling route that merely starts
    // with the same characters.
    expect(isSectionActive("/admin/pages-archive", "/admin/pages")).toBe(false);
    expect(isSectionActive("/admin/pages/new", "/admin/pages")).toBe(true);
  });

  it("should light Settings on its own route", () => {
    expect(isSectionActive("/admin/settings", "/admin/settings")).toBe(true);
    expect(isSectionActive("/admin/posts", "/admin/settings")).toBe(false);
  });
});
