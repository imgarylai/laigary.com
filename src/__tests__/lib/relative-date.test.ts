// Relative timestamps for the admin lists (#180). Absolute dates are close to
// useless there — almost everything was edited recently, and "3 hours ago" vs
// "yesterday" is the distinction being scanned for.

import { describe, it, expect } from "vitest";
import { fmtRelativeFromUnix } from "@/lib/date";

/** A fixed "now" so these never depend on when the suite runs. */
const NOW = Date.UTC(2026, 6, 27, 12, 0, 0);
const ago = (seconds: number) => Math.floor(NOW / 1000) - seconds;

const rel = (seconds: number, locale = "en") => fmtRelativeFromUnix(ago(seconds), locale, NOW);

describe("fmtRelativeFromUnix", () => {
  it.each([
    [30, "now"],
    [90, "1 minute ago"],
    [60 * 45, "45 minutes ago"],
    [3600 * 3, "3 hours ago"],
    [86_400, "yesterday"],
    [86_400 * 3, "3 days ago"],
    // "last week" not "1 week ago": `numeric: "auto"` uses the idiomatic form
    // for a single unit, which is the same rule that gives "yesterday" above.
    [86_400 * 10, "last week"],
    [86_400 * 45, "last month"],
    [86_400 * 400, "last year"],
    [86_400 * 21, "3 weeks ago"],
  ])("should render %i seconds ago as %s", (seconds, expected) => {
    expect(rel(seconds)).toBe(expected);
  });

  it("should pick the largest unit that fits", () => {
    // 90 minutes is "1 hour ago", not "90 minutes ago".
    expect(rel(3600 * 1.5)).toBe("1 hour ago");
  });

  it("should say now for something just saved", () => {
    // `numeric: "auto"` is what turns this into "now" rather than "in 0 seconds",
    // which is what a row saved a moment ago should read as.
    expect(rel(0)).toBe("now");
  });

  it("should speak the caller's language", () => {
    // The whole reason this uses Intl rather than date-fns, which would need a
    // locale bundle imported per language.
    expect(rel(3600 * 3, "zh-TW")).toContain("小時");
    expect(rel(86_400 * 3, "zh-TW")).toContain("天");
  });

  it("should handle a timestamp in the future", () => {
    // Not expected from updatedAt, but clock skew between server and browser
    // makes it reachable, and "in 2 hours" beats "-2 hours ago".
    expect(fmtRelativeFromUnix(Math.floor(NOW / 1000) + 7200, "en", NOW)).toBe("in 2 hours");
  });

  it("should default to the current time", () => {
    // The `now` parameter exists for tests; production passes nothing.
    expect(fmtRelativeFromUnix(Math.floor(Date.now() / 1000), "en")).toBe("now");
  });
});
