// @vitest-environment jsdom
//
// The date column both content lists are now ordered by. Its job is three
// states, and the third — a row flagged "published" that nobody can read yet —
// is the one that looks like a bug without a marker.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PublishDateCell } from "@/components/admin/PublishDateCell";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

afterEach(cleanup);

const HOUR = 3600;
const now = () => Math.floor(Date.now() / 1000);

describe("PublishDateCell", () => {
  it("should show a dash for a row that has never been dated", () => {
    render(<PublishDateCell publishedAt={null} />);

    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.queryByText("postList.scheduled")).toBeNull();
  });

  it("should print the publish date once mounted", () => {
    render(<PublishDateCell publishedAt={now() - HOUR} />);

    // Not asserting the exact string — the point is that a date rendered at
    // all, in the reader's locale rather than as a raw timestamp.
    expect(screen.queryByText(String(now() - HOUR))).toBeNull();
    expect(screen.getByText(/\d{4}/)).toBeTruthy();
  });

  it("should mark a future date as scheduled so a hidden post does not read as live", () => {
    render(<PublishDateCell publishedAt={now() + HOUR} />);

    expect(screen.getByText("postList.scheduled")).toBeTruthy();
  });

  it("should not mark a past date as scheduled", () => {
    // An hour either side of now, so the check cannot be a constant.
    render(<PublishDateCell publishedAt={now() - HOUR} />);

    expect(screen.queryByText("postList.scheduled")).toBeNull();
  });
});
