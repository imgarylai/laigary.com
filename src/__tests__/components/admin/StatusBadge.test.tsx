// @vitest-environment jsdom
//
// The draft/published badge in the post and note lists (#181): it printed the
// raw database value next to a translated filter, and put the heavier styling
// on the wrong one of the two states.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StatusBadge } from "@/components/admin/StatusBadge";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

afterEach(cleanup);

/** The rendered badge element, whichever status it is showing. */
const badge = () => screen.getByText(/^postForm\./);

describe("StatusBadge", () => {
  it("should translate published rather than printing the stored value", () => {
    render(<StatusBadge status="published" />);

    // The filter beside it already used this key; the badge printed `published`.
    expect(screen.getByText("postForm.published")).toBeTruthy();
    expect(screen.queryByText("published")).toBeNull();
  });

  it("should translate draft rather than printing the stored value", () => {
    render(<StatusBadge status="draft" />);

    expect(screen.getByText("postForm.draft")).toBeTruthy();
    expect(screen.queryByText("draft")).toBeNull();
  });

  it("should mark draft as the exception worth noticing", () => {
    // Draft is what you scan a list for, so it carries the filled treatment.
    render(<StatusBadge status="draft" />);

    expect(badge().className).toContain("bg-primary");
  });

  it("should let published recede", () => {
    // Published is the normal state of most rows and needs no attention. It
    // used to be the solid one, which is the inversion this fixes.
    render(<StatusBadge status="published" />);

    const className = badge().className;
    expect(className).not.toContain("bg-primary");
    expect(className).toContain("border-border");
  });

  it("should give the two states visibly different treatments", () => {
    const { container: draft } = render(<StatusBadge status="draft" />);
    const { container: published } = render(<StatusBadge status="published" />);

    expect(draft.firstElementChild?.className).not.toBe(published.firstElementChild?.className);
  });

  it("should treat anything that is not published as a draft", () => {
    // status is a plain string off the row; only "published" is live.
    render(<StatusBadge status="" />);

    expect(screen.getByText("postForm.draft")).toBeTruthy();
  });
});
