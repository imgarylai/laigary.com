# laigary.com

**啟靈工程師**(Psychedelic Engineer)— Gary Lai 的個人 blog,線上網址 [laigary.com](https://laigary.com)。

**TanStack Start (SSR)** 全端應用,部署於 **Cloudflare Workers**,基礎設施以 **Alchemy** IaC 管理。

## 功能

- **前台**:terminal 美學的 blog(文章、標籤)+ `/interview` 面試筆記子站(section / note 兩層)。⌘K 命令面板全站搜尋、light/dark/system 主題、zh-TW/en 雙語 i18n、年份分段列表 + 分頁
- **後台 `/admin`**:完整 CMS(posts / pages / interview sections & notes / tags / settings),Tiptap WYSIWYG 編輯器(官方 `@tiptap/markdown` 橋,內容以 Markdown 存於 D1),Cloudflare Access(Google OAuth)保護
- **SEO**:runtime OG 圖(satori + resvg-wasm,`/api/og*`)、schema.org JSON-LD(BlogPosting / TechArticle / WebSite / BreadcrumbList)、sitemap.xml、feed.xml
- **內容渲染**:unified(remark/rehype)管線 — 語法高亮(highlight.js,未標語言自動偵測;` ```text ` 表不上色)、LaTeX 數學(temml → MathML,零 client JS)
- **分析**:Google Tag Manager(production 才載入)

## 技術棧

| 層                 | 技術                                                        |
| ------------------ | ----------------------------------------------------------- |
| 框架               | TanStack Start (SSR) + TanStack Router(file-based routing)  |
| 部署               | Cloudflare Workers(`@cloudflare/vite-plugin`)               |
| 資料               | Cloudflare D1(Drizzle ORM)+ R2(上傳資產)                    |
| IaC                | Alchemy(`alchemy.run.ts`:Worker、D1、R2、Cloudflare Access) |
| 樣式               | Tailwind CSS 4 + shadcn/ui(Base UI)+ 自訂 terminal 主題     |
| 編輯器             | Tiptap 3 + `@tiptap/markdown`                               |
| OG 圖              | satori(standalone)+ `@resvg/resvg-wasm`                     |
| Linter / Formatter | oxlint / oxfmt                                              |
| 測試               | Vitest(+ better-sqlite3 模擬 D1 的查詢層測試)               |
| Git Hooks          | husky + commitlint(Conventional Commits)+ lint-staged       |

## 開發

```bash
pnpm install
pnpm dev              # http://localhost:3000
```

本地 D1(Vite plugin 的 miniflare 與 `wrangler --local` 共用 `.wrangler/state`):

```bash
npx wrangler d1 migrations apply laigary-db --local   # 建 schema
# 之後可用 wrangler d1 execute laigary-db --local 塞測試資料
```

常用指令:

```bash
pnpm test             # Vitest 全套
pnpm lint             # oxlint
pnpm format:check     # oxfmt
pnpm generate-routes  # tsr generate(dev/build 也會自動跑)
```

## 部署

CI(`.github/workflows/ci.yml`)在每個 PR 跑 Lint / Format / Test / Build 矩陣;merge 進 `main` 後由 **Alchemy** 自動部署(`pnpm exec alchemy deploy --stage prod`)。deploy job 只在 `main` ref 執行 — 手動 `workflow_dispatch` 其他分支只跑檢查、不會部署。

```bash
pnpm build            # 產出 dist/client + dist/server(Workers bundle)
pnpm deploy           # 本機 alchemy deploy(需 .env 內 Cloudflare 憑證)
```

基礎設施定義在 `alchemy.run.ts`(Worker + 自訂網域、D1 + migrations、R2、`/admin` 的 Cloudflare Access)。`wrangler.jsonc` 僅供本地開發(miniflare bindings)與 dry-run 驗證。

## 專案結構

```
src/
  routes/            # file-based routing(routeTree.gen.ts 自動生成)
    _site/           #   前台 blog(pathless layout:/、/posts、/tags、/$slug)
    interview/       #   面試筆記子站(自有 layout 與 header)
    admin/           #   後台 CMS(Cloudflare Access 保護)
    api/             #   OG 圖 server routes(/api/og*)
  components/
    terminal/        #   前台 terminal UI(shell、header、pager、palette)
    admin/           #   後台元件(DataTable、表單、Tiptap 編輯器)
    ui/              #   shadcn/ui primitives(vendored)
  db/                # Drizzle schema 與查詢層
  server/            # createServerFn(public 讀取 / admin mutations / OG 渲染)
  lib/               # markdown 管線、JSON-LD、OG 模板/字型、日期等
  i18n/              # zh-TW / en 語系
  __tests__/         # Vitest(查詢層用 better-sqlite3 假 D1)
migrations/          # D1 SQL migrations(Alchemy 部署時套用)
```
