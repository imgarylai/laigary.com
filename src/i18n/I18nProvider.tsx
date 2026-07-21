import { createContext, useContext, useState, useCallback } from "react";
import { type Locale, defaultLocale, getTranslation } from "./index";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key) => key,
});

// `initialLocale` is resolved on the server (cookie → Accept-Language → default)
// and passed in from the root, so SSR renders in the right language with no
// first-paint flash. Toggling writes a `locale` cookie (read next SSR) plus
// localStorage (back-compat); there is no client read-effect, so the SSR and
// first client render always agree.
export function I18nProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000; samesite=lax`;
      localStorage.setItem("locale", newLocale);
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      let value = getTranslation(locale, key);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{${k}}`, v);
        }
      }
      return value;
    },
    [locale],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
