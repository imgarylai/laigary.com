import { describe, it, expect } from "vitest";
import { computeReadingTime } from "@/lib/date";

// fmtDate / unixToIso are thin date-fns wrappers — not worth testing the library.
// unixToIso is also covered indirectly by the posts query tests (the date field).

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
