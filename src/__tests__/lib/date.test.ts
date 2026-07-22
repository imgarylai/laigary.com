import { describe, it, expect } from "vitest";
import { computeReadingTime, fmtDate, unixToIso } from "@/lib/date";

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
