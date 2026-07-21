import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { interviewShellFn } from "@/server/public";
import { TerminalShell } from "@/components/terminal/TerminalShell";
import type { NavItem } from "@/components/terminal/TmHeader";
import type { PaletteRow } from "@/components/terminal/CommandPalette";
import { FS_INTERVIEW, fsCmd } from "@/lib/fsmap";

// Interview sub-site shell. Fully independent from the blog: its own header
// nav (one item per section + back-to-blog), its own command palette namespace.
export const Route = createFileRoute("/interview")({
  loader: () => interviewShellFn(),
  component: InterviewLayout,
});

function InterviewLayout() {
  const { sections, notes } = Route.useLoaderData();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { label: "~", to: "/interview" },
    ...sections.map((s) => ({
      label: s.slug,
      to: "/interview/$section",
      params: { section: s.slug },
    })),
    { label: "← blog", to: "/" },
  ];

  const paletteRows = useMemo<PaletteRow[]>(() => {
    const pages: PaletteRow[] = [
      {
        kind: "page",
        label: fsCmd(FS_INTERVIEW.home),
        haystack: "interview home",
        onSelect: () => navigate({ to: "/interview" }),
      },
      ...sections.map<PaletteRow>((s) => ({
        kind: "page",
        label: fsCmd(FS_INTERVIEW.section, { sect: s.slug }),
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
    ];
    const noteRows: PaletteRow[] = notes.map((n) => ({
      kind: "content",
      label: fsCmd(FS_INTERVIEW.note, { sect: n.section, slug: n.slug }),
      sub: n.title,
      haystack: `${n.title} ${n.slug} ${n.section}`,
      onSelect: () =>
        navigate({
          to: "/interview/$section/$slug",
          params: { section: n.section, slug: n.slug },
        }),
    }));
    return [...pages, ...noteRows];
  }, [sections, notes, navigate]);

  return (
    <TerminalShell
      homeTo="/interview"
      navItems={navItems}
      paletteRows={paletteRows}
      palettePlaceholder="search notes, sections…"
    >
      <Outlet />
    </TerminalShell>
  );
}
