// @vitest-environment jsdom
//
// Which sidebar entry is lit. It used to compare for exact equality, so the
// section went dark as soon as you opened an editor under it (#179).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const { useLocation } = vi.hoisted(() => ({ useLocation: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  useLocation,
  Link: ({ to, children }: { to: string; children?: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

// The real sidebar primitives need a provider and measure layout; what matters
// here is only which entry receives isActive, so they are reduced to markup
// that records it.
vi.mock("@/components/ui/sidebar", () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Sidebar: passthrough,
    SidebarContent: passthrough,
    SidebarFooter: passthrough,
    SidebarGroup: passthrough,
    SidebarGroupLabel: passthrough,
    SidebarHeader: passthrough,
    SidebarMenu: passthrough,
    SidebarMenuItem: passthrough,
    SidebarMenuSub: passthrough,
    SidebarMenuSubItem: passthrough,
    SidebarMenuButton: ({
      isActive,
      children,
    }: {
      isActive?: boolean;
      children?: React.ReactNode;
    }) => <div data-active={String(!!isActive)}>{children}</div>,
    SidebarMenuSubButton: ({
      isActive,
      children,
    }: {
      isActive?: boolean;
      children?: React.ReactNode;
    }) => <div data-active={String(!!isActive)}>{children}</div>,
  };
});

/** Whether the entry carrying `label` is the highlighted one. */
function activeState(label: string): string | null {
  const entry = screen.getByText(label).closest("[data-active]");
  return entry?.getAttribute("data-active") ?? null;
}

function renderAt(pathname: string) {
  useLocation.mockReturnValue({ pathname });
  render(<AdminSidebar />);
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("AdminSidebar", () => {
  it.each(["/admin/posts", "/admin/posts/new", "/admin/posts/abc123/edit"])(
    "should keep Posts lit on %s",
    (pathname) => {
      renderAt(pathname);

      expect(activeState("admin.posts")).toBe("true");
    },
  );

  it("should light only the section being viewed", () => {
    renderAt("/admin/posts/abc123/edit");

    expect(activeState("admin.posts")).toBe("true");
    expect(activeState("admin.works")).toBe("false");
    expect(activeState("admin.pages")).toBe("false");
    expect(activeState("admin.tags")).toBe("false");
  });

  it.each(["/admin/works", "/admin/works/new", "/admin/works/abc123/edit"])(
    "should keep Works lit on %s",
    (pathname) => {
      renderAt(pathname);

      expect(activeState("admin.works")).toBe("true");
      expect(activeState("admin.posts")).toBe("false");
    },
  );

  it("should keep Pages lit while editing a page", () => {
    renderAt("/admin/pages/about/edit");

    expect(activeState("admin.pages")).toBe("true");
    expect(activeState("admin.posts")).toBe("false");
  });

  it("should light Dashboard only on the dashboard", () => {
    // `/admin` prefixes every admin route, so this is the one entry that must
    // stay an exact match.
    renderAt("/admin");
    expect(activeState("admin.dashboard")).toBe("true");

    cleanup();
    renderAt("/admin/posts/abc123/edit");
    expect(activeState("admin.dashboard")).toBe("false");
  });

  it("should keep Settings lit on its own route", () => {
    renderAt("/admin/settings");

    expect(activeState("admin.settings")).toBe("true");
  });

  it("should keep the interview section lit while editing a note", () => {
    // This one already worked; it is here so a refactor of the others cannot
    // quietly take it with them.
    renderAt("/admin/interview/notes/n1/edit");

    expect(activeState("admin.interview")).toBe("true");
    expect(activeState("admin.interviewNotes")).toBe("true");
  });
});
