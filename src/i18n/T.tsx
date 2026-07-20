import { useI18n } from "./I18nProvider";

/**
 * Tiny client wrapper so server components can render a translated string
 * without converting the whole page to a client component.
 *
 *   <T k="admin.posts" />
 *   <T k="admin.deleteTagTitle" params={{ name: tag.name }} />
 */
export function T({ k, params }: { k: string; params?: Record<string, string> }) {
  const { t } = useI18n();
  return <>{t(k, params)}</>;
}
