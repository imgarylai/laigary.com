import { describe, expect, it } from "vitest";
import { formatReadingTime } from "@/lib/reading-time";
import { getTranslation, type Locale } from "@/i18n";

function translate(locale: Locale) {
  return (key: string, params?: Record<string, string>) => {
    let result = getTranslation(locale, key);
    for (const [key, value] of Object.entries(params ?? {}))
      result = result.replace(`{${key}}`, value);
    return result;
  };
}

describe("formatReadingTime", () => {
  it.each([
    [5, "5 min read"],
    [59, "59 min read"],
    [60, "1 hr read"],
    [61, "1 hr 1 min read"],
    [120, "2 hr read"],
    [170, "2 hr 50 min read"],
  ])("should format %i minutes when the locale is English", (minutes, expected) => {
    expect(formatReadingTime(minutes, translate("en"))).toBe(expected);
  });
  it.each([
    [59, "59 分鐘閱讀"],
    [60, "1 小時閱讀"],
    [170, "2 小時 50 分鐘閱讀"],
  ])("should format %i minutes when the locale is Traditional Chinese", (minutes, expected) => {
    expect(formatReadingTime(minutes, translate("zh-TW"))).toBe(expected);
  });
});
