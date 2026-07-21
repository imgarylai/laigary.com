import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { blogShellFn } from "@/server/public";
import { TerminalShell } from "@/components/terminal/TerminalShell";
import type { NavItem } from "@/components/terminal/TmHeader";
import type { PaletteRow } from "@/components/terminal/CommandPalette";
import { FS_BLOG, FS_INTERVIEW, fsCmd } from "@/lib/fsmap";

// Blog main-site shell (pathless layout). Terminal aesthetic; the interview
// sub-site lives under its own /interview layout with a separate header.
export const Route = createFileRoute("/_site")({
  loader: () => blogShellFn(),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: loaderData.siteName }] : [],
  }),
  component: SiteLayout,
});

const NAV_ITEMS: NavItem[] = [
  { label: "~", to: "/" },
  { label: "archive", to: "/posts" },
  { label: "tags", to: "/tags" },
  { label: "interview", to: "/interview" },
  { label: "about", to: "/$slug", params: { slug: "about" } },
];

function SiteLayout() {
  const { posts } = Route.useLoaderData();
  const navigate = useNavigate();

  const paletteRows = useMemo<PaletteRow[]>(() => {
    const pages: PaletteRow[] = [
      {
        kind: "page",
        label: fsCmd(FS_BLOG.home),
        haystack: "home ~ ls",
        onSelect: () => navigate({ to: "/" }),
      },
      {
        kind: "page",
        label: fsCmd(FS_BLOG.archive),
        haystack: "posts archive all writing",
        onSelect: () => navigate({ to: "/posts" }),
      },
      {
        kind: "page",
        label: fsCmd(FS_BLOG.tags),
        haystack: "tags topics",
        onSelect: () => navigate({ to: "/tags" }),
      },
      {
        kind: "page",
        label: fsCmd(FS_INTERVIEW.home),
        haystack: "interview prep",
        onSelect: () => navigate({ to: "/interview" }),
      },
      {
        kind: "page",
        label: fsCmd(FS_BLOG.page, { slug: "about" }),
        haystack: "about contact",
        onSelect: () => navigate({ to: "/$slug", params: { slug: "about" } }),
      },
    ];
    const postRows: PaletteRow[] = posts.map((p) => ({
      kind: "content",
      label: fsCmd(FS_BLOG.post, { slug: p.slug }),
      sub: p.title,
      haystack: `${p.title} ${p.slug} ${p.tags.join(" ")}`,
      onSelect: () => navigate({ to: "/posts/$slug", params: { slug: p.slug } }),
    }));
    return [...pages, ...postRows];
  }, [posts, navigate]);

  return (
    <TerminalShell
      homeTo="/"
      navItems={NAV_ITEMS}
      paletteRows={paletteRows}
      palettePlaceholder="search posts, tags, pages…"
    >
      <Outlet />
    </TerminalShell>
  );
}
