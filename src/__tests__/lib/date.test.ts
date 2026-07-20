import { describe, it, expect } from "vitest";
import { fmtDate, unixToIso, computeReadingTime } from "@/lib/date";

describe("fmtDate", () => {
  it("formats long by default", () => {
    expect(fmtDate("2024-03-09")).toBe("9 Mar 2024");
  });

  it("formats iso", () => {
    expect(fmtDate("2024-03-09", "iso")).toBe("2024.03.09");
  });

  it("formats short", () => {
    expect(fmtDate("2024-03-09", "short")).toBe("Mar 9");
  });

  it("strips leading zero from day in long format", () => {
    expect(fmtDate("2024-01-05")).toBe("5 Jan 2024");
  });
});

describe("unixToIso", () => {
  it("converts epoch seconds to ISO date", () => {
    // 2024-03-09T00:00:00Z = 1709942400
    const iso = unixToIso(1709942400);
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("zero pads month and day", () => {
    // 2024-01-05 local — exact value depends on TZ but format must be padded
    const iso = unixToIso(1704412800);
    const [, m, d] = iso.split("-");
    expect(m).toHaveLength(2);
    expect(d).toHaveLength(2);
  });
});

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
