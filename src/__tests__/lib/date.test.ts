import { describe, it, expect } from "vitest";
import {
  computeReadingTime,
  datetimeLocalToUnix,
  fmtDate,
  fmtYearRange,
  unixToDatetimeLocal,
  unixToIso,
} from "@/lib/date";

describe("computeReadingTime", () => {
  it("returns at least 1 minute for tiny content", () => {
    expect(computeReadingTime("hi")).toBe(1);
  });

  it("returns 1 for ~200 latin words", () => {
    const words = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");
    expect(computeReadingTime(words)).toBe(1);
  });

  it("scales with content length", () => {
    const words = Array.from({ length: 600 }, (_, i) => `word${i}`).join(" ");
    expect(computeReadingTime(words)).toBe(3);
  });

  it("counts CJK characters at 1.5 weight", () => {
    // 200 CJK chars = 300 effective words = 2 min (ceil)
    const cjk = "中".repeat(200);
    expect(computeReadingTime(cjk)).toBe(2);
  });
});

// fmtDate/unixToIso wrap date-fns, but the format strings are OUR display
// contract (frontend dates, sitemap) — pin them.
describe("fmtDate", () => {
  it("formats long, iso and short variants", () => {
    expect(fmtDate("2026-07-22")).toBe("22 Jul 2026");
    expect(fmtDate("2026-07-22", "iso")).toBe("2026.07.22");
    expect(fmtDate("2026-07-22", "short")).toBe("Jul 22");
  });
});

describe("unixToIso", () => {
  it("converts unix seconds to yyyy-MM-dd", () => {
    // 2026-07-22T00:00:00Z
    expect(unixToIso(1784678400)).toBe("2026-07-22");
  });
});

describe("fmtYearRange", () => {
  it("should render a single year when there is no end year", () => {
    expect(fmtYearRange(2025, null)).toBe("2025");
  });

  it("should render an en-dashed range when the work spans years", () => {
    expect(fmtYearRange(2021, 2023)).toBe("2021–2023");
  });

  it("should collapse to one year when the end year equals the start", () => {
    // Otherwise a work the author filled in on both fields reads "2021–2021".
    expect(fmtYearRange(2021, 2021)).toBe("2021");
  });
});

// The publish-date editor speaks `<input type="datetime-local">`, which has no
// zone in it at all: the string is local wall-clock and the stored value is an
// instant. TZ is pinned to UTC in vitest.config.ts, so these are exact.
describe("datetime-local conversion", () => {
  it("should render a timestamp with the minutes the input needs", () => {
    // Seconds-precision `unixToIso` is not enough — the input rejects a value
    // without a time, and the whole feature is picking one.
    expect(unixToDatetimeLocal(1784678400)).toBe("2026-07-22T00:00");
  });

  it("should read a zone-less input value back as local time", () => {
    expect(datetimeLocalToUnix("2026-07-22T00:00")).toBe(1784678400);
  });

  it("should round-trip a time that is not midnight", () => {
    // Midnight round-trips even if the time half is dropped entirely.
    const unix = 1784678400 + 13 * 3600 + 45 * 60;
    expect(datetimeLocalToUnix(unixToDatetimeLocal(unix))).toBe(unix);
  });

  it("should read an empty field as no date rather than as the epoch", () => {
    // Clearing the field means "publish automatically", not "1970".
    expect(datetimeLocalToUnix("")).toBeNull();
  });

  it("should read a half-typed date as no date rather than NaN", () => {
    // Browsers hand over partial values mid-edit; NaN seconds would be stored.
    expect(datetimeLocalToUnix("2026-13-45T99:99")).toBeNull();
  });
});
