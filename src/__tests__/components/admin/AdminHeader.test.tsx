// @vitest-environment jsdom
//
// The header's breadcrumb, which was blank on the post and note editors — the
// two most-used pages in the admin (#178).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AdminHeader } from "@/components/admin/AdminHeader";

const { useMatches } = vi.hoisted(() => ({ useMatches: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useMatches }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));
// Chrome around the breadcrumb: the trigger needs sidebar context, and neither
// it nor the toggles have anything to do with what is being tested.
vi.mock("@/components/ui/sidebar", () => ({ SidebarTrigger: () => <button>menu</button> }));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => null }));
vi.mock("@/components/admin/LanguageSwitcher", () => ({ LanguageSwitcher: () => null }));

/** Stand in for the router matching a route: the leaf match carries the pattern. */
function matchedAt(fullPath: string | undefined) {
  useMatches.mockImplementation((opts: { select: (m: { fullPath: string }[]) => unknown }) =>
    opts.select(fullPath === undefined ? [] : [{ fullPath: "/admin" }, { fullPath }]),
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("AdminHeader breadcrumb", () => {
  it.each([
    ["/admin/posts/$postId/edit", "admin.editPost"],
    ["/admin/posts/new", "admin.newPost"],
    ["/admin/interview/notes/$noteId/edit", "admin.editNote"],
    ["/admin/pages/new", "admin.newPage"],
    ["/admin/pages/$slug/edit", "admin.editPage"],
    ["/admin/tags", "admin.tags"],
  ])("should name the route on %s", (fullPath, label) => {
    matchedAt(fullPath);

    render(<AdminHeader />);

    expect(screen.getByText(label)).toBeTruthy();
  });

  it("should read the leaf match, not the layout route", () => {
    // Every admin page matches `/admin` as its parent; labelling from that
    // would put "Dashboard" on every screen.
    matchedAt("/admin/posts/$postId/edit");

    render(<AdminHeader />);

    expect(screen.queryByText("admin.dashboard")).toBeNull();
  });

  it("should render nothing rather than a stray key when the route is unknown", () => {
    matchedAt("/somewhere/else");

    const { container } = render(<AdminHeader />);

    expect(container.textContent).not.toContain("admin.");
  });

  it("should survive having no matches at all", () => {
    matchedAt(undefined);

    expect(() => render(<AdminHeader />)).not.toThrow();
  });
});
