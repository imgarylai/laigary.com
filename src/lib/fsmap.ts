// Filesystem map — the single source of truth for the *terminal presentation
// layer* only: the `$ ...` prompt line, breadcrumb text, and command-palette
// label each route shows. Real routing (path matching, params, navigation,
// active state) is owned by TanStack Router; fsmap nodes are keyed by a stable
// id and looked up by the router path. The rule this enforces: never hardcode
// `$ cat ...` strings scattered across components — derive them here.
//
// Conventions:
//   dir  → `ls` / `cd`   (collections you can list)
//   file → `cat`         (singular content pages)
//   cmd  → `man`/free    (actions that aren't a page)

export type FsKind = "dir" | "file" | "cmd";

export interface FsCtx {
  slug?: string;
  sect?: string;
}

export interface FsNode {
  kind: FsKind;
  path: string;
  crumb: (ctx?: FsCtx) => string;
  prompt: (ctx?: FsCtx) => string;
}

// Blog (root namespace = ~). `now` / `projects` / `subscribe` are intentionally
// absent — the current design does not ship them.
export const FS_BLOG = {
  home: { kind: "dir", path: "~", crumb: () => "", prompt: () => "$ ls ." },
  archive: {
    kind: "dir",
    path: "~/posts",
    crumb: () => "posts",
    prompt: () => "$ ls -R ./posts/",
  },
  post: {
    kind: "file",
    path: "~/posts/<slug>.md",
    crumb: (ctx = {}) => `posts/${ctx.slug ?? ""}.md`,
    prompt: (ctx = {}) => `$ cat ./posts/${ctx.slug ?? ""}.md`,
  },
  tags: { kind: "dir", path: "~/tags", crumb: () => "tags", prompt: () => "$ ls ./tags/" },
  tag: {
    kind: "dir",
    path: "~/tags/<slug>",
    crumb: (ctx = {}) => `tags/${ctx.slug ?? ""}`,
    prompt: (ctx = {}) => `$ grep -rl "#${ctx.slug ?? ""}" ./posts/`,
  },
  page: {
    kind: "file",
    path: "~/<slug>.md",
    crumb: (ctx = {}) => `${ctx.slug ?? ""}.md`,
    prompt: (ctx = {}) => `$ cat ./${ctx.slug ?? ""}.md`,
  },
} satisfies Record<string, FsNode>;

// Interview sub-site (namespace = ~/interview). Its own header / palette live
// under the /interview layout; no `about` page.
export const FS_INTERVIEW = {
  home: { kind: "dir", path: "~/interview", crumb: () => "interview", prompt: () => "$ ls ." },
  section: {
    kind: "dir",
    path: "~/interview/<sect>",
    crumb: (ctx = {}) => `interview/${ctx.sect ?? ""}`,
    prompt: (ctx = {}) => `$ cat ./${ctx.sect ?? ""}/README.md`,
  },
  note: {
    kind: "file",
    path: "~/interview/<sect>/<slug>.md",
    crumb: (ctx = {}) => `interview/${ctx.sect ?? ""}/${ctx.slug ?? ""}.md`,
    prompt: (ctx = {}) => `$ cat ./${ctx.sect ?? ""}/${ctx.slug ?? ""}.md`,
  },
} satisfies Record<string, FsNode>;

export type BlogRoute = keyof typeof FS_BLOG;
export type InterviewRoute = keyof typeof FS_INTERVIEW;

// Namespace base for commands rendered inside the interview sub-site.
export const INTERVIEW_BASE = FS_INTERVIEW.home.path;

function truncateSlug(slug: string): string {
  return slug.length > 22 ? slug.slice(0, 20) + "…" : slug;
}

// Header breadcrumb (the `~/…` text after the macOS dots) for a router pathname,
// following the fsmap conventions. Kept here so the presentation strings live in
// one place rather than being reconstructed inside the header component.
export function breadcrumbForPath(pathname: string): string {
  const seg = pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);
  if (seg[0] === "interview") {
    if (seg.length === 1) return FS_INTERVIEW.home.crumb();
    if (seg.length === 2) return FS_INTERVIEW.section.crumb({ sect: seg[1] });
    return FS_INTERVIEW.note.crumb({ sect: seg[1], slug: truncateSlug(seg[2]) });
  }
  if (seg.length === 0) return FS_BLOG.home.crumb();
  if (seg[0] === "posts") {
    return seg.length === 1
      ? FS_BLOG.archive.crumb()
      : FS_BLOG.post.crumb({ slug: truncateSlug(seg[1]) });
  }
  if (seg[0] === "tags") return FS_BLOG.tags.crumb();
  return FS_BLOG.page.crumb({ slug: truncateSlug(seg[0]) });
}

// Command label (palette + drawer) — `cd ./dir` for dirs, `cat ./file` for
// files. `base` is the namespace the command is rendered inside (`~` for the
// blog, `~/interview` for the interview sub-site): paths are shown relative to
// it, and the base itself renders as `cd ~` — so inside /interview, `cd ~`
// means the interview home, matching the namespace-relative prompt lines.
export function fsCmd(node: FsNode, ctx: FsCtx = {}, base = "~"): string {
  const filled = node.path.replace(/<sect>/g, ctx.sect ?? "").replace(/<slug>/g, ctx.slug ?? "");
  const rel = filled === base ? "~" : "./" + filled.slice(base.length + 1);
  if (node.kind === "dir") return `cd ${rel}`;
  if (node.kind === "file") return `cat ${rel}`;
  return node.path;
}
