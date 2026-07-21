# Spike #2 結論:Workers 上生成 OG 圖(satori + resvg-wasm,不用 workers-og)

## TL;DR

- ✅ **可行**:三種 OG(全站 / post / interview note)在 Workers runtime 成功生成 1200×630 PNG,視覺對齊 terminal 美學(深底、JetBrains Mono、中文標題正常)
- ⚠️ **改用 satori + @resvg/resvg-wasm 直連,不用 workers-og**:workers-og 0.0.27 最後發佈 2025-06、單一維護者、鎖 satori ^0.15.2(最新 0.28.1,Vercel 活躍維護)。wrapper 價值僅 ~50 行可自持程式碼
- ⚠️ **CJK 是隱藏需求**:JetBrains Mono 無 CJK 字形;中文(站名/標題/日期)需 Noto Sans TC。採「Google Fonts css2 `text=` 動態 subset」策略(每請求 ~10-20KB TTF,I/O 非 CPU)
- ❌ **免費方案 10ms CPU 額度不夠**:本機 workerd 量測 CPU-bound 部分(satori 3-13ms + resvg 22-40ms)≈ **26-53ms/張**,穩定超過免費方案 10ms/請求限制。需擇一:
  1. **Workers Paid $5/月**(30s CPU)— 最省事
  2. **發佈時預生成 → 存 R2 靜態供應**(request-time 零 CPU,免費方案可行;本站已有 R2 + admin 發佈流程,架構上最乾淨)
  3. Cache API 快取只治標:各 PoP 冷啟第一發仍超限,OG crawler 常打冷 PoP,不可靠

## 技術要點(給後續 SEO issue)

### 依賴與 wasm 載入

```jsonc
// wrangler.jsonc
{
  "compatibility_flags": ["nodejs_compat"],
  "rules": [{ "type": "Data", "globs": ["**/*.ttf"], "fallthrough": true }],
}
```

```ts
import satori, { init as initSatori } from "satori";
import { Resvg, initWasm as initResvg } from "@resvg/resvg-wasm";
import yogaWasm from "satori/yoga.wasm"; // 官方 export
import resvgWasm from "../node_modules/@resvg/resvg-wasm/index_bg.wasm"; // 不在 export map,直取
// 惰性初始化一次:
await Promise.all([initSatori(yogaWasm), initResvg(resvgWasm)]);
```

- Workers 禁止 runtime 動態編譯 wasm → 必須靜態 import(wrangler 預編譯為 `WebAssembly.Module`);satori 0.28 的 `init(InitInput)` 直接吃 `WebAssembly.Module` ✅
- **注意**:整合進 TanStack Start 時要驗證 `@cloudflare/vite-plugin` 對 `.wasm` / `.ttf` import 的處理(spike 用純 wrangler bundler;Vite 路徑另需 `?url` 或等效設定)——這是留給整合階段的已知風險

### 字型

- JetBrains Mono **靜態 TTF**(Regular + Bold,各 ~270KB)bundle 進 worker;satori 不吃 woff2,repo 現有 `@fontsource-variable`(variable woff2)不可用
- CJK 動態 subset:fetch `fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=<去重字元>`,**UA 必須用 Safari 5**(`AppleWebKit/533.21.1 … Version/5.0.5 Safari/533.21.1`)才會回 truetype;舊 Firefox UA 會回 woff(satori 也不吃)
- `fontFamily: "JetBrains Mono, Noto Sans TC"`,satori 依 fonts 陣列順序做 glyph fallback

### 量測數據

**真實 production(`laigary-og-spike` 部署於 workers.dev,`wrangler tail` 的 `cpuTime`,7 次請求):**
| 請求 | cpuTime | wallTime | outcome |
|---|---|---|---|
| site(冷啟) | **317ms** | 423ms | ok |
| post ×3 | 80 / 195 / 262ms | 148-403ms | ok |
| note ×3 | 65 / 86 / 231ms | 113-409ms | ok |

- **cpuTime 65–317ms/張**(冷 isolate 高、warm 低;production CPU 比本機 Apple Silicon 慢 2-6 倍)
- Worker Startup Time: 48ms(上限 400ms ✅)
- 全部 outcome ok、無 1102 —— 表示帳號目前的方案撐得住;但 **65–317ms 對免費方案 10ms 上限是 6-30 倍超標**,免費額度 request-time 生成確定不可行
- Bundle:3.9MB raw / **1.43MB gzip**(免費方案上限 3MB gzip ✅;resvg wasm 佔 2.4MB raw)
- PNG 輸出 17-30KB

**本機 workerd 參考(Apple Silicon,warm):** satori 3-13ms + resvg 22-40ms;CJK subset fetch 74-374ms(I/O,不計 CPU)

## 建議

採 **方案 2(發佈時預生成存 R2)**:

- 免費方案可行、request-time 零 CPU 零延遲、對 crawler 最穩
- admin 已有發佈流程可掛 hook;全站 OG 為靜態一張
- 生成程式碼與本 PoC 相同,只是觸發點從 request-time 移到 publish-time
- 若未來上 Workers Paid,可無痛改回 request-time + Cache API

## PoC 位置

repo `spikes/og/`(`src/index.ts` 為完整可跑 worker)。使用方式:目錄內 `pnpm install` 後 `pnpm dev`,打 `/?type=site|post|note&title=…&sect=…&date=…`;`&svg=1` 可隔離 satori/resvg 成本。量測用的 `laigary-og-spike` worker 已於量測後刪除。
