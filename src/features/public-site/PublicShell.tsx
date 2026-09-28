import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useHotkeys } from "react-hotkeys-hook";
import { useI18n } from "@/i18n/I18nProvider";
import { searchPostsFn } from "@/server/posts";
import { searchInterviewNotesFn } from "@/server/public";
import { CommandPalette, type PaletteRow } from "@/features/terminal/CommandPalette";
import { LABS } from "@/lib/labs";
import { PublicHeader } from "./Header";
import { PublicFooter, type FooterSocial } from "./Footer";
import { PUBLIC_NAV } from "./navigation";

// Both route layouts share identity and search. Existing server functions keep
// their visibility/scheduling rules; no content index is loaded with the shell.
export function PublicShell({
  social,
  sections = [],
  children,
}: {
  social: FooterSocial;
  sections?: { slug: string; label: string }[];
  children: ReactNode;
}) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  useHotkeys(
    "mod+k",
    (event) => {
      event.preventDefault();
      setSearchOpen((open) => !open);
    },
    { enableOnFormTags: true, enableOnContentEditable: true },
  );

  const pages = useMemo<PaletteRow[]>(
    () => [
      {
        kind: "page",
        label: t("public.home"),
        haystack: "home",
        onSelect: () => navigate({ to: "/" }),
      },
      ...PUBLIC_NAV.map(({ labelKey, ...link }): PaletteRow => ({
        kind: "page",
        label: t(labelKey),
        haystack: `${link.to} ${labelKey}`,
        onSelect: () => navigate(link),
      })),
      ...(
        [
          { to: "/tags", key: "topics", words: "tags topics" },
          { to: "/labs", key: "labs", words: "labs demos playground" },
          { to: "/interview", key: "notes", words: "interview notes 筆記" },
          {
            to: "/tools/wade-giles-name",
            key: "nameTool",
            words: "wade giles passport 威妥瑪 護照",
          },
        ] as const
      ).map(({ to, key, words }): PaletteRow => ({
        kind: "page",
        label: t(`public.${key}`),
        haystack: words,
        onSelect: () => navigate({ to }),
      })),
      ...LABS.map((lab): PaletteRow => ({
        kind: "page",
        label: lab.slug,
        haystack: `${lab.slug} ${lab.tagline}`,
        onSelect: () => navigate({ to: lab.to }),
      })),
      ...sections.map((section): PaletteRow => ({
        kind: "page",
        label: section.label,
        haystack: section.slug,
        onSelect: () => navigate({ to: "/interview/$section", params: { section: section.slug } }),
      })),
    ],
    [navigate, sections, t],
  );

  const searchContent = useCallback(
    async (q: string): Promise<PaletteRow[]> => {
      const [{ posts }, notes] = await Promise.all([
        searchPostsFn({ data: { q, limit: 20 } }),
        searchInterviewNotesFn({ data: { q } }),
      ]);
      return [
        ...posts.map((post): PaletteRow => ({
          kind: "content",
          label: t("public.essay"),
          sub: post.title,
          haystack: post.title,
          onSelect: () => navigate({ to: "/posts/$slug", params: { slug: post.slug } }),
        })),
        ...notes.map((note): PaletteRow => ({
          kind: "content",
          label: t("public.note"),
          sub: note.title,
          haystack: note.title,
          onSelect: () =>
            navigate({
              to: "/interview/$section/$slug",
              params: { section: note.section, slug: note.slug },
            }),
        })),
      ];
    },
    [navigate, t],
  );

  return (
    <div className="public-site" lang={locale === "zh-TW" ? "zh-Hant" : "en"}>
      <a href="#main-content" className="public-skip-link">
        {t("public.skipContent")}
      </a>
      <PublicHeader onOpenSearch={() => setSearchOpen(true)} />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter social={social} />
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        pages={pages}
        searchContent={searchContent}
        placeholder={t("blog.search.placeholder")}
      />
    </div>
  );
}
