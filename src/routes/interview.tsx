import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { interviewShellFn, searchInterviewNotesFn } from "@/server/public";
import { TerminalShell, TmNotFound, type NavItem, type PaletteRow } from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_INTERVIEW, INTERVIEW_BASE, fsCmd } from "@/lib/fsmap";

// Interview sub-site shell. Fully independent from the blog: its own header
// nav (one item per section + back-to-blog), its own command palette namespace.
export const Route = createFileRoute("/interview")({
  loader: () => interviewShellFn(),
  component: InterviewLayout,
  // Dead interview URLs keep this sub-site's shell around the 404.
  notFoundComponent: TmNotFound,
});

function InterviewLayout() {
  const { sections, siteName, social } = Route.useLoaderData();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Commands (drawer + palette) are rendered relative to the interview
  // namespace, matching its prompt lines: home is `cd ~`, sections are
  // `cd ./coding`, and leaving the namespace is `cd ../blog`.
  const navItems: NavItem[] = [
    { label: "~", to: "/interview", cmd: fsCmd(FS_INTERVIEW.home, {}, INTERVIEW_BASE) },
    ...sections.map((s) => ({
      label: s.slug,
      to: "/interview/$section",
      params: { section: s.slug },
      cmd: fsCmd(FS_INTERVIEW.section, { sect: s.slug }, INTERVIEW_BASE),
    })),
    { label: "← blog", to: "/", cmd: "cd ../blog" },
  ];

  // Sections + fixed routes only — pre-loaded and filtered locally.
  const palettePages = useMemo<PaletteRow[]>(
    () => [
      {
        kind: "page",
        label: fsCmd(FS_INTERVIEW.home, {}, INTERVIEW_BASE),
        haystack: "interview home",
        onSelect: () => navigate({ to: "/interview" }),
      },
      ...sections.map<PaletteRow>((s) => ({
        kind: "page",
        label: fsCmd(FS_INTERVIEW.section, { sect: s.slug }, INTERVIEW_BASE),
        sub: s.label,
        haystack: `${s.slug} ${s.label}`,
        onSelect: () => navigate({ to: "/interview/$section", params: { section: s.slug } }),
      })),
      {
        kind: "page",
        label: "cd ../blog",
        haystack: "back to blog",
        onSelect: () => navigate({ to: "/" }),
      },
    ],
    [sections, navigate],
  );

  // Notes searched on demand across sections (title match) — never pre-loaded.
  const paletteSearch = useCallback(
    async (query: string): Promise<PaletteRow[]> => {
      const notes = await searchInterviewNotesFn({ data: { q: query } });
      return notes.map((n) => ({
        kind: "content",
        label: fsCmd(FS_INTERVIEW.note, { sect: n.section, slug: n.slug }, INTERVIEW_BASE),
        sub: n.title,
        haystack: `${n.title} ${n.slug} ${n.section}`,
        onSelect: () =>
          navigate({
            to: "/interview/$section/$slug",
            params: { section: n.section, slug: n.slug },
          }),
      }));
    },
    [navigate],
  );

  return (
    <TerminalShell
      homeTo="/interview"
      navItems={navItems}
      palettePages={palettePages}
      paletteSearch={paletteSearch}
      palettePlaceholder={t("blog.search.placeholderInterview")}
      siteName={siteName}
      social={social}
    >
      <Outlet />
    </TerminalShell>
  );
}
