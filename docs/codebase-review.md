# Codebase review — 2026-09-28

本次檢查涵蓋路由與 SSR 邊界、公開／後台 server functions、查詢與快取、MCP、Markdown／編輯器、後台表單、上傳、i18n、部署設定與測試。以程式碼檢查及本機驗證為主；沒有修改 production D1、部署或執行遠端寫入。這不是完整滲透測試，也未逐頁做瀏覽器視覺驗收。

結論：現有的 route → server function → query 分層值得保留。主要問題是局部重複、少數責任放錯模組，以及需獨立處理的權限／快取邊界，不需要換框架或建立通用 CRUD 系統。

## 已完成

- **共用刪除流程**：`DeleteContentDialog` 承擔 pending 狀態、錯誤提示、關閉與路由失效。文章、筆記、作品、頁面、標籤、章節保留各自的 RPC 與翻譯文案；標籤使用清單和章節連帶刪除警告仍在原呼叫端。修正 rejected RPC 讓按鈕永久停在刪除中的問題；新增重試測試已先在原版重現失敗。
- **減少 schema 漂移**：post、note、work 的 update schema 改從 create schema 的 `.partial()` 衍生，再加入必要的 id。保留各類型不同的內容要求、nullable 欄位及部分更新語意，沒有強制讓所有內容共用同一 schema。
- **調整查詢責任**：`getTagsWithCounts` 從 `posts.ts` 移到 `tags.ts`。它統計文章、筆記、作品，本來就不是文章專屬功能。query barrel 的公開介面及 SQL／快取行為維持不變。

## 優先後續事項

### 已修正：後台 RPC 的登入驗證缺口

36 個後台 RPC（包含 GET、寫入與上傳）均附加 `requireAdmin` middleware。沿用現有 Cloudflare Access 登入，透過 `jose` 驗證 assertion header 或 `CF_Authorization` cookie 的 RS256 簽章、issuer、audience、到期時間與必要 claims。公開 RPC 與 MCP 的原有認證邊界不變。

Alchemy 將現有 Access application 提前建立／讀取，將其 `aud` 綁定為 `ACCESS_AUD`，issuer 使用已確認的 `https://garylai.cloudflareaccess.com`。workers.dev 和 preview URLs 在 Alchemy／Wrangler 都明確關閉。只有 DEV build 略過驗證；正式 build 缺少 token 回傳 401，帶 token 但缺少設定回傳 503。

本機 production Worker 已對 36 個後台 RPC 分別發出未登入 GET／POST，全數回傳 401；公開語系 RPC 回傳 200。未部署，尚未以真實使用者 Access session 做正式環境登入驗收。下一次正常 Alchemy 部署會套用 bindings 和入口設定，不需新增秘密金鑰。

依據：[Cloudflare JWT 驗證文件](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/) 與 TanStack Intent server-functions guidance。

### P1：排程發佈與兩層快取的交界

`_visibility.ts` 會刷新已到期的下一次發佈時間，但 `_cache.ts` 中的標籤／章節公開統計仍可存活 60 秒。推論情境：發佈前產生 aggregate cache，發佈後 edge miss 使用舊 aggregate 渲染，接著在沒有下一次排程時存入一天的 edge cache。短暫的 query staleness 可能因此延長到文件 TTL。

需用控制時間的測試重現跨層時序，再讓公開 aggregate 的有效期／失效機制也尊重排程。單純降低整站 edge TTL 會犧牲目前節省 D1 查詢的設計；本次不在搬移 tag query 時順帶改變此行為。

### P2：驗證錯誤文案未完全國際化

`PageForm`、`NoteForm`、`WorkForm` 等仍在 Zod schema 使用英文錯誤訊息；部分 server action 的錯誤也直接顯示。現有 locale parity 測試只證明兩份 JSON 對齊，不能檢查硬編碼文案。建議另做小幅修正：先統一使用者看得到的欄位錯誤，不把全部內部錯誤改成新的錯誤框架。

### P2：專案指南與測試環境不同步

`AGENTS.md` 的 DOM 測試說明與目前多數測試使用 happy-dom 不一致。應另行確認指南希望採用的預設，避免新增測試的人被誤導。已修正 `vitest.config.ts` 的 CSS stub 註解和 `posts.ts` 的 SQLite NULL 排序註解，實作不變。

## 刻意保留

- 各內容類型分開的表單與查詢：欄位、slug 身分、章節搬移、發佈日期都有真實差異。
- D1 `runBatch`、既有分頁／索引、`revalidateContent` 呼叫位置與快取介面。
- Tiptap markdown bridge、server/client 邊界 workaround、vendored UI 元件。
- `interview.ts` 與 MCP registry 雖然長，但先不為檔案行數而拆檔；未證明收益前不新增 repository／service 抽象層。

## 驗證

- 修改前：152 個測試檔、1,682 個測試通過；typecheck、format 通過；lint 有既存 React warnings。
- 新的網路失敗重試測試：原版 1 failed / 3 passed，確認捕捉到真實問題。
- 重構後：152 個測試檔、1,683 個測試通過。
- 權限修正新增 JWT、middleware 與全後台 RPC 覆蓋檢查。移除 JWT 驗證時 10 個測試失敗；移除任一後台 middleware 時覆蓋檢查失敗。
- 最終：155 個測試檔、1,740 個測試通過；typecheck、production build、format 通過；lint 成功且保留既存 React warnings。36 個後台 RPC 的本機 production HTTP 驗證均為 401，公開語系 RPC 為 200。未部署。
