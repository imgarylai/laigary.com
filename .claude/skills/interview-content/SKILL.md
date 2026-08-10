---
name: interview-content
description: Conventions for reading and writing the site's published content — interview notes and blog posts stored in Cloudflare D1. Use when rewriting or creating an interview note, editing a post body, fixing headings/complexity/links inside content_md, assigning tags, or restructuring the coding section. Covers where the content lives, what may go into a note, the note structure, and the link/tag rules.
---

# Interview content conventions

These rules govern **published content** (`content_md` on `interview_notes` and
`posts`), not application code. For code conventions see `AGENTS.md`.

The owner (Gary) writes these notes to revise for interviews. A note is a record
of what he actually solved — not a survey of the problem.

## What the notes are for

A note exists so he can **re-derive the answer under interview conditions**, not
look it up. Four priorities follow from that, and they decide every judgement
call below:

1. **Reasoning beats the result.** How he got from the problem's features to the
   algorithm is the valuable part; the final code is the cheap part. When a note
   is thin, the missing piece is almost always the derivation, not more code.
2. **Shared ideas beat special-case tricks.** Frame a solution as an instance of
   a pattern he can carry to the next problem. A clever trick that only works
   here earns at most a line in `## 補充`.
3. **Generic variable names matter.** Prefer the names the pattern uses
   (`left` / `right`, `dp`, `cur`, `prev`, `seen`, `total`) over problem-specific
   ones. The point is that the code reads the same across every note using that
   pattern.
4. **A workable solution beats a perfect one.** The target is what he could
   actually produce and explain in an interview. Do not replace an accepted
   solution with an optimal one, and do not present the optimal variant as the
   standard the note falls short of.

## Where the content lives

Post and note bodies are rows in Cloudflare D1 (`laigary-db`), **not files in
this repo**. Never look for a note's markdown on disk.

**Writing** goes through the site's own MCP server (`https://laigary.com/mcp`,
source in `src/server/mcp/`), connected as `laigary`:

- `get_interview_note` / `update_interview_note` / `create_interview_note`
- `get_post` / `update_post` / `create_post`
- `search_interview_notes`, `search_posts`, `list_tags`, `list_interview_sections`

Write tools need the `MCP_ADMIN_TOKEN` bearer header, already configured in the
user-scope MCP config. Once the owner approves the change, write directly — he
does not want hand-run SQL files any more.

**Reading in bulk** may go through wrangler when a query is easier than the MCP
tools. It must run from the repo root, otherwise it fails with "set a
CLOUDFLARE_API_TOKEN":

```bash
npx wrangler d1 execute laigary-db --remote --json --command "SELECT ..."
```

**Very large bodies:** POST the JSON-RPC call to `/mcp` with curl, reading the
token out of `~/.claude.json`, instead of pasting a whole note into a tool
argument.

**Deletes** have no MCP tool — that is a deliberate safety boundary. They need
SQL, and they need the owner's approval first.

**Do not run `pnpm content:export`.** The `content/` tree was a byte-faithful git
snapshot; it is frozen and drifts from D1 by design. Wiring the export into CI
has been declined twice — do not offer it again.

## What may go into a note

### Only document what he wrote

**Problem notes: never add a solution he did not write.** Rewriting means
restructuring and correcting _his_ prose and code. Do not append an approach he
never coded, however standard it is. (A quickselect section added to note 215 and
a Counter variant added to 740 were both cut: 「我不要你自己加內容，我如果有寫筆記
應該照我原本的去調整就好」/「我不要加上非我自己寫的解法」.)

**Tips and template notes: only APIs that appear in his own solution code**, each
linked to the problem where he used it. No "common in interviews but you haven't
used it" additions — 「沒用過就沒關係了，我已經刷題這麼多年了，代表我沒遇過」.

To decide what he has used, scan real usage rather than recalling what is
standard, and **grep ` ```python ` blocks only** — prose mentions cause false
positives (`.find(` matched `self.find(x)` from union-find in four notes).
Frequency findings are worth reporting back; they surface gaps he did not expect.

**Corrections to his own text are welcome** — a wrong complexity claim, a base
case that contradicts the prose, a dangling sentence. Report them, then fix what
he approves.

Removing a solution usually strands references in `## 補充` and `## 複雜度` —
grep the whole note for its variable names before publishing.

### No wall-clock numbers

Keep timings ("實測 50.1 ms → 43.5 ms") out of notes — a number he cannot
reproduce while revising is noise. Write the structural reason instead:
「$O(n^2)$ 個子字串、每個切片和 hash 都要 $O(n)$」 survives, "4.35 ms → 0.34 ms"
does not.

Counts that are properties of the algorithm rather than of a laptop **are** fine:
狀態數, 答案數, how many candidates a prune blocked, how many cases a differential
test caught.

Measuring is still worth doing — it is how a claim gets verified before
publishing. Report the numbers in chat; keep the note to the reason.

## How the prose should read

These are Gary's notes, not product documentation. He asked for this explicitly
on 2026-08-10, reviewing a draft written the other way: 「你的寫法太 AI 了，能
不能寫得像人類一點」.

His own register is long, loose sentences that occasionally ramble, plain
opinions, and very little typographic emphasis — 「我第一次練習時也沒有自己想到，
解法真的是滿精妙的」. Match that. The specific tells that made a draft read as
generated:

- **Bold-bombing.** A paragraph where every third phrase is bolded reads as
  machine-written. Bold at most the one or two claims in a note that genuinely
  carry it, and usually none.
- **Section-closing punch lines.** Do not end a section with a summary slogan on
  its own line (「這句話在面試講出來就對了」). State the judgement inside a
  sentence and move on.
- **Listing what is really prose.** A bullet list is for genuinely parallel,
  enumerable items. Three tools that have a recommended order among them are a
  sentence, not three bullets.
- **Em dashes.** `——` everywhere is a tell. Normal punctuation usually does the
  job.
- **Forced symmetry.** Every section the same length, every one ending in a
  table, every comparison in threes. Let sections be as long as they need to be.

Tables are fine, and staying in tables is often better than a code block for
tabular content (he asked for that conversion on the same note). The generated
feel lives in the prose, not in the tables.

Voice comes from sentence rhythm and stated judgement (「新專案大概直接選它就
好」), never from invented first-person experience. Do not write 「我以前以為⋯⋯」
or any other recollection on his behalf: the same rule that bars inventing his
solutions ("Only document what he wrote" above) bars inventing his history.

## Note structure

The agreed shape for a coding problem note. Headings are **h2** so they land in
the sidebar ToC — `src/lib/toc.ts` extracts h2/h3 only, so an h4 is invisible.

```
（開頭：LeetCode 連結 + 題意）

## 思路          — how to get from the problem's features to the algorithm in an
                   interview (not the solution itself)
## 解題方向      — each solution under an h3
### 暴力解
### 動態規劃
## 補充          — optional
## 複雜度        — always last, every note has one
```

`## 思路` is the most valuable section — it is where priorities 1 and 2 above
live. His older notes usually already contain this reasoning buried in
unstructured prose: **surface it, do not invent it.** It is distinct from
`## 面試時的講法` (how to _say_ it), which some notes also have.

Existing per-approach h2s (`## 暴力解`, `## 動態規劃`, `## 自底向上`, `## 遞迴`)
become h3 under `## 解題方向`.

### The complexity block

Fixed format — chosen over a table because being able to justify the number out
loud is the actual interview skill:

```text
## 複雜度

**中心擴散**
- 時間 $O(n^2)$ — n 個中心，每個最多擴散 n 次
- 空間 $O(1)$ — 只用幾個索引變數

**動態規劃**
- 時間 $O(n^2)$ — 填滿半張 dp 表
- 空間 $O(n^2)$ — dp 表大小；滾動陣列可降到 $O(n)$

其中 $n$ 是字串長度。
```

(The fence is `text`, not `markdown`, on purpose: oxfmt reformats markdown
inside a markdown-tagged fence and would insert a blank line after each bolded
solution name, silently changing the format this section prescribes.)

Rules:

- One block per solution, solution name bolded; omit the name when the note has
  only one solution.
- Every line carries a short reason after an em dash.
- Close with what `n` / `m` stand for.
- Always wrap notation in `$...$` — never a bare `O(n)`.
- Write `$O(n \log n)$`, not `$O(nlogn)$`.

## Links

**Inside note content, internal links are relative:**
`/interview/<section>/<slug>` — sections are `coding`, `behavior-question`,
`system-design`. Never absolute `laigary.com` URLs. There is no `/interview/notes`
path.

**In chat replies, always write the full `https://laigary.com/interview/...`
URL** — the owner reads them in a terminal, where a bare path is not clickable.

**Tag links use the filter URL with the tag NAME, url-encoded — not the slug:**
`/interview/<section>?tag=<Tag%20Name>`.

**Drop anchors** on internal links: the markdown renderer emits no heading ids.

Always validate a `/interview/coding/<slug>` link against the DB before writing
it. A few concept pages from the old GitBook (Python 排序技巧, Merge Sort, Graph 圖, 100. Same Tree) were never migrated — link those to the closest tag filter or the
LeetCode page instead.

**`updated_at` is not something to police.** Do not verify it after a write and
do not report drift in it — he edits notes in the admin UI himself, which bumps
it anyway.

## Tags

**A tag means "this technique solves the problem", not "this is what my note
implements":** 「bfs dfs 都可以解的，應該可以上兩個 tag」. A grid-connectivity
problem gets both BFS and DFS even if the note shows only one; an MST problem gets
both `Heap` (Prim) and `UnionFind` (Kruskal).

The applied rule for `Breadth-First Search` / `Depth-First Search`:

| Problem shape                          | Tags                             |
| -------------------------------------- | -------------------------------- |
| shortest path / fewest steps           | **BFS only** (DFS would mislead) |
| enumerate all paths                    | **DFS only**                     |
| connectivity, flood fill, reachability | **both**                         |
| MST / Dijkstra / UnionFind-shaped      | **neither**                      |

`Tree` used to be over-applied to grid and state-space BFS problems (probably
because BFS was first learned via level-order traversal). Those were moved to
`Graph` in a 2026-07-25 cleanup — keep `Tree` for actual tree problems.

**Judging BFS vs DFS from a note:** grep its ` ```python ` blocks only, never the
prose — sentences like 「這題可以用 DFS」 inflate a naive count. Signals:
`deque(` / `popleft(` → BFS; `def dfs|helper|traverse` or `stack.pop()` → DFS.

## The coding section's structure

Three layers, all `interview_notes` rows under the `coding` section:

1. **Index note** `coding-interview-preparation` — the curated entry point. The
   12 題型 are **h2** and their sub-topics **h3**. Each 題型 block links to its
   template with a `模板 → [...]` line. Ends with 各題型模板 and 經典系列一起看
   (both h2).
2. **Template notes** `<topic>-template` — one per 題型 (backtracking,
   binary-search, sliding-window, two-pointers, linked-list, tree-traversal,
   bfs-dfs, monotonic-stack, dynamic-programming, heap-topk, intervals). Same
   shape each: core template code → variants → verified example links →
   「面試時的講法」 → tag link. Tagged with their own topic tag.
3. **Problem notes** — the ~437 per-LeetCode-problem solutions.

**Sub-topic rule (owner's):** most 題型 stay a single flat list of 6–8 problems.
Only a 題型 with a very large note count gets h3 sub-topics, and each sub-topic is
**at most 4 problems** — one sitting should be one sub-topic. Only two qualify:

- **Tree** — 11 sub-topics: 遍歷基本功 / 層序遍歷的變形 / 深度與結構比較 /
  路徑總和家族 / 後序回傳值（樹形 DP）/ LCA / BST 與中序遍歷 / BST 的增刪查 /
  序列化與重建 / 改寫指標 / N-ary Tree.
- **Dynamic Programming** — 6 sub-topics: 一維遞推入門 / 選或不選 / 背包三形態 /
  兩個字串一起走 / 網格 DP / 子序列與字串切分.

Settled decisions — do not re-litigate:

- Trie under Tree was tried and **rejected**.
- Two Pointers, Backtrack, Binary Search and Graph stay **flat** — one template
  covers each; use tag filters instead.
- Stock-price problems live in 經典系列一起看, not in a DP sub-topic.

**Trimming principle** when a list gets long: drop near-duplicates that drill the
identical skill (144 vs 94/145, 111 vs 104, 257 vs 113, 449 vs 297, 106 vs 105)
and interview-rare problems.

## After a write

Fetch the live page with curl and check that headings, math and code blocks
rendered. Do not check `updated_at`, and do not run the content export.
