import { Link, useLocation } from "@tanstack/react-router";
import { TmPage } from "./layout";
import { AsciiRule, PromptLine } from "./ui";
import { useI18n } from "@/i18n/I18nProvider";

// Terminal-flavored 404. Wired as the router's defaultNotFoundComponent (bare
// document, unmatched URLs) and as the notFoundComponent of the _site and
// /interview layouts, where fuzzy not-found matching renders it inside the
// TerminalShell so the header/nav survive a dead link.
export function TmNotFound() {
  const { pathname } = useLocation();
  const { t } = useI18n();

  return (
    <TmPage narrow>
      <PromptLine className="mb-1.5">{`$ cat ~${pathname}`}</PromptLine>
      <pre className="m-0 text-[calc(0.9062rem*var(--tm-fs))] leading-[1.7] text-tm-fg">
        {`cat: ~${pathname}: No such file or directory\n[exit 1]`}
      </pre>

      <AsciiRule className="mt-6 mb-3" />
      <p className="text-[calc(0.875rem*var(--tm-fs))] leading-[1.8] text-tm-muted">
        {t("blog.notFound.hint")}
      </p>
      <p className="text-[calc(0.875rem*var(--tm-fs))] leading-[1.8] text-tm-muted">
        <Link to="/" className="text-tm-accent no-underline">
          $ cd ~
        </Link>
        {t("blog.notFound.back")}
      </p>
    </TmPage>
  );
}
