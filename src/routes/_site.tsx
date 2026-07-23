import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { blogShellFn } from "@/server/public";
import { searchPostsFn } from "@/server/posts";
import { TerminalShell, TmNotFound, type NavItem, type PaletteRow } from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG, FS_INTERVIEW, fsCmd } from "@/lib/fsmap";

// Blog main-site shell (pathless layout). Terminal aesthetic; the interview
// sub-site lives under its own /interview layout with a separate header.
export const Route = createFileRoute("/_site")({
  loader: () => blogShellFn(),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: loaderData.siteName }] : [],
  }),
  component: SiteLayout,
  // Fuzzy not-found matching lands here for dead blog URLs (e.g. a post
  // loader's notFound()), keeping the TerminalShell around the 404.
  notFoundComponent: TmNotFound,
});

// Drawer commands come from fsmap (fsCmd) so files render as `cat` — the
// about page is `cat ./about.md`, not `cd ./about`.
const NAV_ITEMS: NavItem[] = [
  { label: "~", to: "/", cmd: fsCmd(FS_BLOG.home) },
  { label: "posts", to: "/posts", cmd: fsCmd(FS_BLOG.archive) },
  { label: "tags", to: "/tags", cmd: fsCmd(FS_BLOG.tags) },
  { label: "interview", to: "/interview", cmd: fsCmd(FS_INTERVIEW.home) },
  {
    label: "about",
    to: "/$slug",
    params: { slug: "about" },
    cmd: fsCmd(FS_BLOG.page, { slug: "about" }),
  },
];

function SiteLayout() {
  const { siteName, social } = Route.useLoaderData();
  const navigate = useNavigate();
  const { t } = useI18n();

  // Static routes only — pre-loaded and filtered locally in the palette.
  const palettePages = useMemo<PaletteRow[]>(
    () => [
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
    ],
    [navigate],
  );

  // Posts are searched on demand (title match) — never pre-loaded.
  const paletteSearch = useCallback(
    async (query: string): Promise<PaletteRow[]> => {
      const { posts } = await searchPostsFn({ data: { q: query, limit: 20 } });
      return posts.map((p) => ({
        kind: "content",
        label: fsCmd(FS_BLOG.post, { slug: p.slug }),
        sub: p.title,
        haystack: `${p.title} ${p.slug}`,
        onSelect: () => navigate({ to: "/posts/$slug", params: { slug: p.slug } }),
      }));
    },
    [navigate],
  );

  return (
    <TerminalShell
      homeTo="/"
      navItems={NAV_ITEMS}
      palettePages={palettePages}
      paletteSearch={paletteSearch}
      palettePlaceholder={t("blog.search.placeholder")}
      siteName={siteName}
      social={social}
    >
      <Outlet />
    </TerminalShell>
  );
}
