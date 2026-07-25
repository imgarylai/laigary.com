---
slug: "complexity-cheatsheet"
section: "coding"
title: "複雜度速查"
status: "published"
pinned: false
tags: []
created_at: 1784877910
updated_at: 1784921433
published_at: 1784877910
---
面試時被問「這樣的複雜度是多少」，最好的回答不是報一個數字，而是**說出它從哪裡來**。這篇整理各題型的典型複雜度、推導的依據，以及最常被追問的陷阱。

## 各題型速查

| 題型 | 時間 | 空間 | 複雜度從哪裡來 |
| --- | --- | --- | --- |
| [雙指針](/interview/coding/two-pointers-template) | $O(n)$ | $O(1)$ | 兩個指針各單向走完一次；需要先排序的話變 $O(n \log n)$ |
| [滑動窗口](/interview/coding/sliding-window-template) | $O(n)$ | $O(k)$ | 每個元素進窗口、出窗口各一次 |
| [二分搜尋](/interview/coding/binary-search-template) | $O(\log n)$ | $O(1)$ | 每次丟掉一半 |
| 對答案二分 | $O(n \log M)$ | $O(1)$ | $\log M$ 次判定，每次花 $O(n)$ 驗證（$M$ 是值域大小） |
| [Hash Table](/interview/coding?tag=Hash%20Table) | $O(n)$ | $O(n)$ | 查表均攤 $O(1)$，典型的用空間換時間 |
| [單調棧](/interview/coding/monotonic-stack-template) | $O(n)$ | $O(n)$ | 每個元素進棧、出棧各一次，所以巢狀迴圈仍是線性 |
| [Linked List](/interview/coding/linked-list-template) | $O(n)$ | $O(1)$ | 指針操作不需要額外空間 |
| [樹的遍歷](/interview/coding/tree-traversal-template) | $O(n)$ | $O(h)$ | 每個節點訪問一次；空間是遞迴深度 $h$ |
| [BFS / DFS](/interview/coding/bfs-dfs-template) | $O(V + E)$ | $O(V)$ | 每個節點與每條邊各處理一次 |
| 網格上的 BFS / DFS | $O(mn)$ | $O(mn)$ | 節點數是 $mn$，邊數是它的常數倍 |
| [回溯](/interview/coding/backtracking-template) | 見下方 | $O(n)$ | 空間是遞迴深度，不含存答案的空間 |
| [動態規劃](/interview/coding/dynamic-programming-template) | 狀態數 × 轉移成本 | 狀態數 | DP 唯一要記的公式 |
| [Heap / Top K](/interview/coding/heap-topk-template) | $O(n \log k)$ | $O(k)$ | $n$ 次操作，每次 $O(\log k)$ |
| [Intervals](/interview/coding/intervals-template) | $O(n \log n)$ | $O(n)$ | 排序主導，掃描本身只要 $O(n)$ |
| Trie | 建樹 $O(\sum L)$、查詢 $O(L)$ | $O(\sum L \times \Sigma)$ | $L$ 是字串長度，$\Sigma$ 是字元集大小 |
| UnionFind | 均攤 $O(\alpha(n))$ | $O(n)$ | 路徑壓縮加上按秩合併後，$\alpha$ 幾乎是常數 |

## DP：狀態數 × 轉移成本

這是唯一需要記住的 DP 公式，其他都是它的特例：

| 形狀 | 複雜度 | 例題 |
| --- | --- | --- |
| 一維、轉移 $O(1)$ | 時間 $O(n)$、空間 $O(n)$（能滾動就降到 $O(1)$） | [70. Climbing Stairs](/interview/coding/70-climbing-stairs) |
| 一維、轉移要掃前面所有格 | $O(n^2)$ | [300. LIS](/interview/coding/300-longest-increasing-subsequence) |
| 二維、兩個字串 | $O(mn)$ | [1143. LCS](/interview/coding/1143-longest-common-subsequence) |
| 背包 | $O(n \times W)$ | [416. Partition Equal Subset Sum](/interview/coding/416-partition-equal-subset-sum) |

背包那一列要注意：這是**偽多項式**時間 — $W$ 是數值大小而不是輸入長度，面試官很愛追問這一點。

## 回溯：解空間的大小就是下界

回溯的複雜度由「有多少個解要列舉」決定。剪枝改善的是常數，不會改變上界：

| 型態 | 複雜度 | 例題 |
| --- | --- | --- |
| 子集 | $O(n \times 2^n)$ | [78. Subsets](/interview/coding/78-subsets) |
| 排列 | $O(n \times n!)$ | [46. Permutations](/interview/coding/46-permutations) |
| 組合 | $O(k \times C(n,k))$ | [77. Combinations](/interview/coding/77-combinations) |
| 網格搜尋 | $O(mn \times 4^L)$ | [79. Word Search](/interview/coding/79-word-search) |

前面乘的那個 $n$ 或 $k$ 是「把答案複製一份到結果陣列」的成本，很容易被漏掉。

## 最常被追問的五個陷阱

1.  **遞迴的空間別忘了** — 樹的遍歷是 $O(h)$ 不是 $O(1)$；不平衡時退化成 $O(n)$。這是面試官最愛的追問。
2.  **排序藏在裡面** — 一旦排序，時間下限就是 $O(n \log n)$，不管後面掃得多快。
3.  **均攤不等於最壞** — Hash Table 查詢均攤 $O(1)$、最壞 $O(n)$；動態陣列 append 均攤 $O(1)$。講得出「均攤」這個詞會加分。
4.  **輸出空間算不算** — 先問面試官。慣例是不含輸出，所以回傳陣列的題目常寫「額外空間 $O(1)$」。
5.  **字串切片不是免費的** — Python 的 `s[i:j]` 是 $O(j-i)$，寫在迴圈裡會把 $O(n)$ 偷偷變成 $O(n^2)$。同理 `list.pop(0)` 是 $O(n)$，要用 `deque`。

## 面試時的講法

先講**時間**再講**空間**，而且兩個都要說出理由：「時間是 $O(n)$，因為每個元素最多進出棧一次；空間是 $O(n)$，最壞情況整個陣列都在棧裡。」

如果知道解法還不是最優，主動說出來 —「這是 $O(n^2)$，我覺得用 hash 可以降到 $O(n)$，要我改嗎？」— 這比等面試官提示好得多。

回到總索引 → [Coding Interview Preparation](/interview/coding/coding-interview-preparation)
