import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { GiscusConfig } from "@/lib/giscus";

const GISCUS_ORIGIN = "https://giscus.app";

// giscus comment thread (GitHub Discussions, pathname-mapped). The client
// script is injected once per mount; theme changes are pushed to the live
// iframe via postMessage so a toggle doesn't reload the thread.
export function Comments({ config }: { config: GiscusConfig | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const { locale } = useI18n();
  const theme = resolvedTheme === "light" ? "light" : "dark";

  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const container = containerRef.current;
    if (!config || !container) return;
    const script = document.createElement("script");
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    const attrs: Record<string, string> = {
      "data-repo": config.repo,
      "data-repo-id": config.repoId,
      "data-category": config.category,
      "data-category-id": config.categoryId,
      "data-mapping": "pathname",
      "data-strict": "0",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "bottom",
      "data-theme": themeRef.current,
      "data-lang": locale === "zh-TW" ? "zh-TW" : "en",
      "data-loading": "lazy",
    };
    for (const [key, value] of Object.entries(attrs)) script.setAttribute(key, value);
    container.appendChild(script);
    return () => container.replaceChildren();
  }, [config, locale]);

  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    iframe?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, GISCUS_ORIGIN);
  }, [theme]);

  if (!config) return null;
  return <div ref={containerRef} className="giscus mt-8" />;
}
