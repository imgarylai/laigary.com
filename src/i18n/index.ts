import en from "./locales/en.json";
import zhTW from "./locales/zh-TW.json";

export type Locale = "en" | "zh-TW";

export const locales: Record<Locale, Record<string, unknown>> = {
  en,
  "zh-TW": zhTW,
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
};

export const defaultLocale: Locale = "en";

export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split(".");
  let value: unknown = locales[locale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof value === "string" ? value : key;
}
