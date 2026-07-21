import { describe, it, expect } from "vitest";
import { pickLocale } from "@/server/locale";

describe("pickLocale", () => {
  it("prefers a valid cookie over everything", () => {
    expect(pickLocale("zh-TW", "en-US,en")).toBe("zh-TW");
    expect(pickLocale("en", "zh-TW,zh")).toBe("en");
  });

  it("ignores an invalid cookie and falls back to Accept-Language", () => {
    expect(pickLocale("fr", "zh-TW,zh;q=0.9")).toBe("zh-TW");
    expect(pickLocale(undefined, "zh-Hant,zh;q=0.9,en;q=0.8")).toBe("zh-TW");
  });

  it("falls back to the default (en) when nothing matches zh", () => {
    expect(pickLocale(undefined, "en-US,en;q=0.9")).toBe("en");
    expect(pickLocale(undefined, undefined)).toBe("en");
    expect(pickLocale(undefined, "")).toBe("en");
  });
});
