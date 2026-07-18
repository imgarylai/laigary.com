# laigary.com

**啟靈工程師**（Psychedelic Engineer）— Gary Lai 的個人 blog。

由 [`laigary.com-next`](https://github.com/imgarylai/laigary.com-next)（Next.js + OpenNext）遷移到 **TanStack Start (SSR)**，hosting 為 **Cloudflare Workers**，IaC 採用 **Alchemy**。遷移 roadmap 與進度見 [Epic #1](https://github.com/imgarylai/laigary.com/issues/1)。

> 本 commit 為 **Phase 1 — Scaffold**（[#4](https://github.com/imgarylai/laigary.com/issues/4)）的地基：一個已驗證可部署到 Cloudflare Workers 的 TanStack Start 骨架。

## 技術棧

| 層                 | 技術                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| 框架               | TanStack Start (SSR) + TanStack Router（file-based routing）                                |
| 部署               | Cloudflare Workers（`@cloudflare/vite-plugin`，`main: @tanstack/react-start/server-entry`） |
| Build              | Vite                                                                                        |
| 樣式               | Tailwind CSS 4                                                                              |
| Linter / Formatter | oxlint / oxfmt                                                                              |
| Git Hooks          | husky + commitlint（Conventional Commits）                                                  |
| 測試               | Vitest                                                                                      |

## 開發

```bash
pnpm install
pnpm dev              # http://localhost:3000
```

## Build / 部署

```bash
pnpm build                     # 產出 dist/client + dist/server（Workers bundle）
npx wrangler deploy --dry-run  # 驗證可部署性（不需憑證、不上傳）
pnpm deploy                    # build + wrangler deploy（需 Cloudflare 憑證）
```

部署設定在 `wrangler.jsonc`（Worker 名稱、compatibility flags、observability）與 `vite.config.ts`（Cloudflare vite plugin）。D1 / R2 / KV bindings 之後在 Alchemy IaC 階段（[#9](https://github.com/imgarylai/laigary.com/issues/9)）以 `alchemy.run.ts` 定義。

## 路由

file-based routing，路由檔在 `src/routes/`；`__root.tsx` 為根 layout；`routeTree.gen.ts` 由 `tsr generate` 自動生成（build 時自動跑）。
