# laigary.com

**Unconstrained** — Gary Lai's personal blog, live at [laigary.com](https://laigary.com).

A **TanStack Start (SSR)** full-stack app deployed on **Cloudflare Workers**, with infrastructure managed as code via **Alchemy**.

## Features

- **Public site** — terminal-aesthetic blog (posts, tags) plus the `/interview` prep-notes sub-site (sections → notes). ⌘K command palette for site-wide search, light/dark/system theme, zh-TW/en i18n, year-sectioned lists with pagination
- **Admin `/admin`** — full CMS (posts / pages / interview sections & notes / tags / settings) with a Tiptap WYSIWYG editor (official `@tiptap/markdown` bridge; content stored as Markdown in D1), protected by Cloudflare Access (Google OAuth)
- **SEO** — runtime OG images (satori + resvg-wasm, `/api/og*`), schema.org JSON-LD (BlogPosting / TechArticle / WebSite / BreadcrumbList), sitemap.xml, feed.xml
- **Content rendering** — unified (remark/rehype) pipeline: syntax highlighting (highlight.js, auto-detection for untagged fences; ` ```text ` opts out), LaTeX math via temml → MathML (zero client JS)
- **Analytics** — Google Tag Manager (production builds only)

## Tech stack

| Layer              | Technology                                                              |
| ------------------ | ----------------------------------------------------------------------- |
| Framework          | TanStack Start (SSR) + TanStack Router (file-based routing)             |
| Hosting            | Cloudflare Workers (`@cloudflare/vite-plugin`)                          |
| Data               | Cloudflare D1 (Drizzle ORM) + R2 (uploaded assets)                      |
| IaC                | Alchemy (`alchemy.run.ts`: Worker, D1, R2, Cloudflare Access)           |
| Styling            | Tailwind CSS 4 + shadcn/ui (Base UI) + custom terminal theme            |
| Editor             | Tiptap 3 + `@tiptap/markdown`                                           |
| OG images          | satori (standalone) + `@resvg/resvg-wasm`                               |
| Linter / Formatter | oxlint / oxfmt                                                          |
| Testing            | Vitest (query layer tested against better-sqlite3 as a stand-in for D1) |
| Git hooks          | husky + commitlint (Conventional Commits) + lint-staged                 |

## Development

```bash
pnpm install
pnpm dev              # http://localhost:3000
```

Local D1 (the Vite plugin's miniflare shares `.wrangler/state` with `wrangler --local`):

```bash
npx wrangler d1 migrations apply laigary-db --local   # create the schema
# then seed with: wrangler d1 execute laigary-db --local ...
```

Common commands:

```bash
pnpm test             # full Vitest suite
pnpm lint             # oxlint
pnpm format:check     # oxfmt
pnpm generate-routes  # tsr generate (also runs automatically on dev/build)
```

## Deployment

CI (`.github/workflows/ci.yml`) runs the Lint / Format / Test / Build matrix on every PR; merges to `main` deploy automatically via **Alchemy** (`pnpm exec alchemy deploy --stage prod`). The deploy job only runs on the `main` ref — a manual `workflow_dispatch` on any other branch runs the checks without deploying.

```bash
pnpm build            # emits dist/client + dist/server (Workers bundle)
pnpm deploy           # local alchemy deploy (needs Cloudflare credentials in .env)
```

Infrastructure lives in `alchemy.run.ts` (Worker + custom domain, D1 + migrations, R2, Cloudflare Access on `/admin`). `wrangler.jsonc` exists only for local dev (miniflare bindings) and dry-run validation.

## Project structure

```
src/
  routes/            # file-based routing (routeTree.gen.ts is generated)
    _site/           #   public blog (pathless layout: /, /posts, /tags, /$slug)
    interview/       #   interview-notes sub-site (own layout and header)
    admin/           #   admin CMS (Cloudflare Access-protected)
    api/             #   OG image server routes (/api/og*)
  components/
    terminal/        #   public-site terminal UI (shell, header, pager, palette)
    admin/           #   admin components (DataTable, forms, Tiptap editor)
    ui/              #   shadcn/ui primitives (vendored)
  db/                # Drizzle schema + query layer
  server/            # createServerFn (public reads / admin mutations / OG render)
  lib/               # markdown pipeline, JSON-LD, OG templates/fonts, dates
  i18n/              # zh-TW / en locales
  __tests__/         # Vitest (query layer runs on better-sqlite3 as fake D1)
migrations/          # D1 SQL migrations (applied by Alchemy on deploy)
```
