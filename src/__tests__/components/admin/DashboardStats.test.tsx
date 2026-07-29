// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// t(key) returns the key so labels are stable to query.
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

import { DashboardStats } from "@/components/admin/DashboardStats";

afterEach(() => cleanup());

describe("DashboardStats", () => {
  it("renders a card per metric with its value", () => {
    render(
      <DashboardStats
        stats={{
          postsTotal: 7,
          postsPublished: 5,
          postsDrafts: 2,
          notes: 3,
          works: 6,
          pages: 1,
          tags: 4,
        }}
      />,
    );
    expect(screen.getByText("admin.published").previousSibling?.textContent).toBe("5");
    expect(screen.getByText("admin.drafts").previousSibling?.textContent).toBe("2");
    expect(screen.getByText("admin.totalPosts").previousSibling?.textContent).toBe("7");
    expect(screen.getByText("admin.notes").previousSibling?.textContent).toBe("3");
    expect(screen.getByText("admin.totalWorks").previousSibling?.textContent).toBe("6");
    expect(screen.getByText("admin.pages").previousSibling?.textContent).toBe("1");
    expect(screen.getByText("admin.tags").previousSibling?.textContent).toBe("4");
  });
});
