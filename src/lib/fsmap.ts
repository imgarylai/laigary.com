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

// Command-palette label — `cd ./dir` for dirs, `cat ./file` for files.
export function fsCmd(node: FsNode, ctx: FsCtx = {}): string {
  const rel = node.path
    .replace(/^~\/?/, "./")
    .replace(/<sect>/g, ctx.sect ?? "")
    .replace(/<slug>/g, ctx.slug ?? "")
    .replace(/^\.\/$/, "~");
  if (node.kind === "dir") return `cd ${rel}`;
  if (node.kind === "file") return `cat ${rel}`;
  return node.path;
}
