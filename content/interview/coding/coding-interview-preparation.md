---
slug: "coding-interview-preparation"
section: "coding"
title: "Coding Interview Preparation"
status: "published"
pinned: true
tags: []
created_at: 1784874589
updated_at: 1784876687
published_at: 1784874589
---
這一頁是 coding 面試準備的總索引：先照題型把最值得反覆練習的題目刷熟，需要時查各題型的模板，最後把同一個系列的題目放在一起看，感受題目是怎麼被「加料」變形的。

下面依題型列出最需要練習的題目，每一類附一句該題型的核心提醒；想看同類型的更多題目，點每段最後的 tag 連結。

## Array & Two Pointers

> 先問「陣列有沒有排序」— 排序後大多能用雙指針把 $O(n^2)$ 降到 $O(n)$。想不出解法時先寫暴力解，再觀察哪些計算是重複的。

模板 → [Two Pointers 模板](/interview/coding/two-pointers-template)

- [1. 2 Sum](/interview/coding/1-2-sum)
- [15. 3 Sum](/interview/coding/15-3-sum)
- [11. Container With Most Water](/interview/coding/11-container-with-most-water)
- [125. Valid Palindrome](/interview/coding/125-valid-palindrome)
- [88. Merge Sorted Array](/interview/coding/88-merge-sorted-array)
- [26. Remove Duplicates from Sorted Array](/interview/coding/26-remove-duplicates-from-sorted-array)
- [42. Trapping Rain Water](/interview/coding/42-trapping-rain-water)
- [167. Two Sum II - Input array is sorted](/interview/coding/167-two-sum-ii-input-array-is-sorted)

更多同類型題目 → [#Two Pointers](/interview/coding?tag=Two%20Pointers)

## Sliding Window

> 右指針負責擴張、左指針負責收縮。動手前先講清楚窗口要維護的條件是什麼（不重複？至多 k 個？），條件被破壞了才移動左指針。

模板 → [Sliding Window 模板](/interview/coding/sliding-window-template)

- [3. Longest Substring Without Repeating Characters](/interview/coding/3-longest-substring-without-repeating-characters)
- [76. Minimum Window Substring](/interview/coding/76-minimum-window-substring)
- [209. Minimum Size Subarray Sum](/interview/coding/209-minimum-size-subarray-sum)
- [424. Longest Repeating Character Replacement](/interview/coding/424-longest-repeating-character-replacement)
- [567. Permutation in String](/interview/coding/567-permutation-in-string)
- [1004. Max Consecutive Ones III](/interview/coding/1004-max-consecutive-ones-iii)
- [239. Sliding Window Maximum](/interview/coding/239-sliding-window-maximum)
- [1423. Maximum Points You Can Obtain from Cards](/interview/coding/1423-maximum-points-you-can-obtain-from-cards)

更多同類型題目 → [#Sliding Window](/interview/coding?tag=Sliding%20Window)

## Binary Search

> 除了「在排序陣列裡找元素」，更常考的是**對答案二分**（如 Koko 吃香蕉：答案有單調性就能二分）。邊界寫法固定一種（例如左閉右閉）練到閉著眼睛都不會錯。

模板 → [Binary Search 模板](/interview/coding/binary-search-template)

- [704. Binary Search](/interview/coding/704-binary-search)
- [33. Search in Rotated Sorted Array](/interview/coding/33-search-in-rotated-sorted-array)
- [153. Find Minimum in Rotated Sorted Array](/interview/coding/153-find-minimum-in-rotated-sorted-array)
- [34. Find First and Last Position of Element in Sorted Array](/interview/coding/34-find-first-and-last-position-of-element-in-sorted-array)
- [74. Search a 2D Matrix](/interview/coding/74-search-a-2d-matrix)
- [875. Koko Eating Bananas](/interview/coding/875-koko-eating-bananas)
- [162. Find Peak Element](/interview/coding/162-find-peak-element)
- [4. Median of Two Sorted Arrays](/interview/coding/4-median-of-two-sorted-arrays)

更多同類型題目 → [#Binary Search](/interview/coding?tag=Binary%20Search)

## Hash Table

> 空間換時間的第一選擇：「找配對、查出現過沒有、分組」都先想 hash。2 Sum 的「補數」思路是一大票題目的原型。

- [1. 2 Sum](/interview/coding/1-2-sum)
- [49. Group Anagrams](/interview/coding/49-group-anagrams)
- [128. Longest Consecutive Sequence](/interview/coding/128-longest-consecutive-sequence)
- [242. Valid Anagram](/interview/coding/242-valid-anagram)
- [560. Subarray Sum Equals K](/interview/coding/560-subarray-sum-equals-k)
- [454. 4 Sum II](/interview/coding/454-4-sum-ii)

更多同類型題目 → [#Hash Table](/interview/coding?tag=Hash%20Table)

## Stack

> 「最近的、還沒處理完的東西」就是 stack。成對符號、計算器用普通棧；「下一個更大/更小元素」系列想單調棧。

模板 → [單調棧模板](/interview/coding/monotonic-stack-template)

- [20. Valid Parentheses](/interview/coding/20-valid-parentheses)
- [155. Min Stack](/interview/coding/155-min-stack)
- [739. Daily Temperatures](/interview/coding/739-daily-temperatures)
- [84. Largest Rectangle in Histogram](/interview/coding/84-largest-rectangle-in-histogram)
- [224. Basic Calculator](/interview/coding/224-basic-calculator)
- [227. Basic Calculator II](/interview/coding/227-basic-calculator-ii)
- [394. Decode String](/interview/coding/394-decode-string)
- [496. Next Greater Element I](/interview/coding/496-next-greater-element-i)

更多同類型題目 → [#Stack](/interview/coding?tag=Stack)

## Linked List

> dummy head + 快慢指針可以解掉八成的題。先畫圖再寫 code — 指針改動的順序錯了是最常見的 bug。

模板 → [Linked List 模板](/interview/coding/linked-list-template)

- [206. Reverse Linked List](/interview/coding/206-reverse-linked-list)
- [21. Merge Two Sorted Lists](/interview/coding/21-merge-two-sorted-lists)
- [141. Linked List Cycle](/interview/coding/141-linked-list-cycle)
- [876. Middle of the Linked List](/interview/coding/876-middle-of-the-linked-list)
- [19. Remove Nth Node From End of List](/interview/coding/19-remove-nth-node-from-end-of-list)
- [143. Reorder List](/interview/coding/143-reorder-list)
- [138. Copy List with Random Pointer](/interview/coding/138-copy-list-with-random-pointer)
- [92. Reverse Linked List II](/interview/coding/92-reverse-linked-list-ii)

更多同類型題目 → [#Linked List](/interview/coding?tag=Linked%20List)

## Tree

> 先決定遍歷方式（前序 / 中序 / 後序 / 層序），再決定遞迴要回傳什麼給父節點 — 大多數題目就是「在遍歷的某個時機做事」。看到 BST 先想「中序遍歷 = 遞增」。

模板 → [Tree 遍歷模板](/interview/coding/tree-traversal-template)

Tree 是我寫過最多題的一類，變形也最雜，所以這裡再往下拆成小主題，一組四題、一次練一組：

### 遍歷基本功

遞迴版寫熟之後要能改成 iterative（自己用 stack 模擬），這是最常見的追問。

- [94. Binary Tree Inorder Traversal](/interview/coding/94-binary-tree-inorder-traversal)
- [145. Binary Tree Postorder Traversal](/interview/coding/145-binary-tree-postorder-traversal)
- [102. Binary Tree Level Order Traversal](/interview/coding/102-binary-tree-level-order-traversal)

### 層序遍歷的變形

同一個 BFS 骨架，差別只在「每一層要取什麼」：整層、最右邊一個、最大值、最深的一層。

- [103. Binary Tree Zigzag Level Order Traversal](/interview/coding/103-binary-tree-zigzag-level-order-traversal)
- [199. Binary Tree Right Side View](/interview/coding/199-binary-tree-right-side-view)
- [515. Find Largest Value in Each Tree Row](/interview/coding/515-find-largest-value-in-each-tree-row)

### 深度與結構比較

兩棵樹一起遞迴就是同步走。最小深度要小心「單邊子樹為空」不算葉節點，而且用 BFS 找到第一個葉節點就能提早結束。

- [104. Maximum Depth of Binary Tree](/interview/coding/104-maximum-depth-of-binary-tree)
- [100. Same Tree](/interview/coding/100-same-tree)
- [572. Subtree of Another Tree](/interview/coding/572-subtree-of-another-tree)

### 路徑總和家族

從「根到葉」一路加碼到「任意起點終點」。先問清楚路徑的定義，再決定要不要回溯、要不要前綴和。

- [112. Path Sum](/interview/coding/112-path-sum)
- [113. Path Sum II](/interview/coding/113-path-sum-ii)
- [437. Path Sum III](/interview/coding/437-path-sum-iii)

### 後序回傳值（樹形 DP）

這類題的精髓：**回傳給父節點的值，和答案要的值常常不一樣**。124 回傳單邊最大、答案卻取左右相加，講得出這個差別就贏一半。

- [124. Binary Tree Maximum Path Sum](/interview/coding/124-binary-tree-maximum-path-sum)
- [543. Diameter of Binary Tree](/interview/coding/543-diameter-of-binary-tree)
- [337. House Robber III](/interview/coding/337-house-robber-iii)

### 最近共同祖先（LCA）

236 的「左右子樹各找到一個，那我就是答案」是原型。BST 可以直接用值域往下走；給了 parent 指標就退化成兩條鏈結串列求相交。

- [236. Lowest Common Ancestor of a Binary Tree](/interview/coding/236-lowest-common-ancestor-of-a-binary-tree)
- [235. Lowest Common Ancestor of a Binary Search Tree](/interview/coding/235-lowest-common-ancestor-of-a-binary-search-tree)
- [1650. Lowest Common Ancestor of a Binary Tree III](/interview/coding/1650-lowest-common-ancestor-of-a-binary-tree-iii)

### BST 與中序遍歷

看到 BST 先寫中序 — 它就是一個遞增序列。驗證、找第 k 小、找出被交換的兩個節點，全都是同一招。

- [98. Validate Binary Search Tree](/interview/coding/98-validate-binary-search-tree)
- [230. Kth Smallest Element in a BST](/interview/coding/230-kth-smallest-element-in-a-bst)
- [173. Binary Search Tree Iterator](/interview/coding/173-binary-search-tree-iterator)

### BST 的增刪查

查跟插入都很短，刪除要處理「有兩個子節點」的情況（拿中序後繼頂替）— 這題值得完整背下來。

- [700. Search in a Binary Search Tree](/interview/coding/700-search-in-a-binary-search-tree)
- [450. Delete Node in a BST](/interview/coding/450-delete-node-in-a-bst)

### 序列化與重建

兩個必答的點：哪兩種遍歷可以唯一還原一棵樹，以及為什麼補上 null 標記之後光靠前序就夠了。

- [297. Serialize and Deserialize Binary Tree](/interview/coding/297-serialize-and-deserialize-binary-tree)
- [105. Construct Binary Tree from Preorder and Inorder Traversal](/interview/coding/105-construct-binary-tree-from-preorder-and-inorder-traversal)

### 改寫指標 / 換結構

這類題不是在算答案，是在原地改指標。先在紙上畫出「改完長什麼樣」再動手，不然一定接錯。

- [226. Invert Binary Tree](/interview/coding/226-invert-binary-tree)
- [114. Flatten Binary Tree to Linked List](/interview/coding/114-flatten-binary-tree-to-linked-list)
- [426. Convert Binary Search Tree to Sorted Doubly Linked List](/interview/coding/426-convert-binary-search-tree-to-sorted-doubly-linked-list)
- [116. Populating Next Right Pointers in Each Node](/interview/coding/116-populating-next-right-pointers-in-each-node)

### N-ary Tree

把 `left` / `right` 換成 `children` 迴圈，二元樹的寫法幾乎可以整套搬過來。

- [429. N-ary Tree Level Order Traversal](/interview/coding/429-n-ary-tree-level-order-traversal)
- [428. Serialize and Deserialize N-ary Tree](/interview/coding/428-serialize-and-deserialize-n-ary-tree)

更多同類型題目 → [#Tree](/interview/coding?tag=Tree)

## Graph & BFS/DFS

> 先把題目翻譯成「節點是什麼、邊是什麼」。最短路徑 / 逐層擴散 → BFS；連通性 → DFS 或 UnionFind；依賴順序 → 拓撲排序。

模板 → [BFS / DFS 模板](/interview/coding/bfs-dfs-template)

- [200. Number of Islands](/interview/coding/200-number-of-islands)
- [133. Clone Graph](/interview/coding/133-clone-graph)
- [207. Course Schedule](/interview/coding/207-course-schedule)
- [210. Course Schedule II](/interview/coding/210-course-schedule-ii)
- [547. Number of Provinces](/interview/coding/547-number-of-provinces)
- [994. Rotting Oranges](/interview/coding/994-rotting-oranges)
- [1091. Shortest Path in Binary Matrix](/interview/coding/1091-shortest-path-in-binary-matrix)
- [323. Number of Connected Components in an Undirected Graph](/interview/coding/323-number-of-connected-components-in-an-undirected-graph)

更多同類型題目 → [#Graph](/interview/coding?tag=Graph)

## Backtracking

> 模板是固定的：做選擇 → 遞迴 → 撤銷選擇。真正的難點在剪枝和去重（先排序，同層跳過重複元素）。

模板 → [Backtracking 模板](/interview/coding/backtracking-template)

- [46. Permutations](/interview/coding/46-permutations)
- [78. Subsets](/interview/coding/78-subsets)
- [39. Combination Sum](/interview/coding/39-combination-sum)
- [22. Generate Parentheses](/interview/coding/22-generate-parentheses)
- [79. Word Search](/interview/coding/79-word-search)
- [131. Palindrome Partitioning](/interview/coding/131-palindrome-partitioning)
- [77. Combinations](/interview/coding/77-combinations)
- [51. & 52. N Queens](/interview/coding/51-52-n-queens)

更多同類型題目 → [#Backtrack](/interview/coding?tag=Backtrack)

## Dynamic Programming

> 順序是：先講得出暴力遞迴 → 加上 memo → 需要時再轉成表格。面試時把「dp[i] 代表什麼」的狀態定義說清楚，比急著寫 code 重要。

模板 → [Dynamic Programming 模板](/interview/coding/dynamic-programming-template)

DP 的題量僅次於 Tree，而且子題型之間差得很遠，所以也往下拆成小主題，一組三題：

### 一維遞推入門

先寫出「第 i 項只依賴前面幾項」的遞推式，再想能不能只用兩個變數滾動。91 是同一套遞推加上條件判斷。

- [70. Climbing Stairs](/interview/coding/70-climbing-stairs)
- [746. Min Cost Climbing Stairs](/interview/coding/746-min-cost-climbing-stairs)
- [91. Decode Ways](/interview/coding/91-decode-ways)

### 選或不選（House Robber 系列）

狀態是「到第 i 個為止，選了 / 沒選」。740 換了個皮，排序後就是一樣的題。

- [198. House Robber](/interview/coding/198-house-robber)
- [213. House Robber II](/interview/coding/213-house-robber-ii)
- [740. Delete and Earn](/interview/coding/740-delete-and-earn)

### 背包三形態

完全背包求最少個數、完全背包求方案數、0/1 背包求可不可行 — 三題把「迴圈順序決定了什麼」講完。

- [322. Coin Change](/interview/coding/322-coin-change)
- [518. Coin Change 2](/interview/coding/518-coin-change-2)
- [416. Partition Equal Subset Sum](/interview/coding/416-partition-equal-subset-sum)

### 兩個字串一起走

`dp[i][j]` 代表兩個字串各取前 i、前 j 個的答案。差別只在「字元相同 / 不同時」怎麼轉移。

- [1143. Longest Common Subsequence](/interview/coding/1143-longest-common-subsequence)
- [72. Edit Distance](/interview/coding/72-edit-distance)
- [583. Delete Operation for Two Strings](/interview/coding/583-delete-operation-for-two-strings)

### 網格 DP

從左上走到右下最直觀，但要先確認能不能原地改陣列、以及第一行第一列的初始化。

- [62. Unique Paths](/interview/coding/62-unique-paths)
- [64. Minimum Path Sum](/interview/coding/64-minimum-path-sum)
- [221. Maximal Square](/interview/coding/221-maximal-square)

### 子序列與字串切分

這三題的狀態定義最容易講錯，面試時務必先說清楚 `dp[i]` 是「以 i 結尾」還是「前 i 個」。

- [300. Longest Increasing Subsequence](/interview/coding/300-longest-increasing-subsequence)
- [5. Longest Palindromic Substring](/interview/coding/5-longest-palindromic-substring)
- [139. Word Break](/interview/coding/139-word-break)

更多同類型題目 → [#Dynamic Programming](/interview/coding?tag=Dynamic%20Programming)

## Heap

> 「前 k 個 / 第 k 大 / 資料流中動態取最大最小」就是 heap 的訊號。Python 只有 min-heap，要最大堆就把值取負放進去。

模板 → [Heap / Top K 模板](/interview/coding/heap-topk-template)

- [215. Kth Largest Element in an Array](/interview/coding/215-kth-largest-element-in-an-array)
- [347. Top K Frequent Elements](/interview/coding/347-top-k-frequent-elements)
- [295. Find Median from Data Stream](/interview/coding/295-find-median-from-data-stream)
- [23. Merge k Sorted Lists](/interview/coding/23-merge-k-sorted-lists)
- [973. K Closest Points to Origin](/interview/coding/973-k-closest-points-to-origin)
- [703. Kth Largest Element in a Stream](/interview/coding/703-kth-largest-element-in-a-stream)

更多同類型題目 → [#Heap](/interview/coding?tag=Heap)

## Intervals

> 幾乎都是先按起點排序，然後只需要比較「前一段的結尾」和「下一段的開頭」。Meeting Rooms II 的「拆成開始/結束兩條時間線」值得單獨記住。

模板 → [Intervals 模板](/interview/coding/intervals-template)

- [56. Merge Intervals](/interview/coding/56-merge-intervals)
- [252. Meeting Rooms](/interview/coding/252-meeting-rooms)
- [253. Meeting Rooms II](/interview/coding/253-meeting-rooms-ii)
- [57. Insert Interval](/interview/coding/57-insert-interval)
- [435. Non-overlapping Intervals](/interview/coding/435-non-overlapping-intervals)
- [986. Interval List Intersections](/interview/coding/986-interval-list-intersections)

更多同類型題目 → [#Intervals](/interview/coding?tag=Intervals)

## 各題型模板

把一個題型的固定寫法整理成一篇，面試前快速復習用 — 每篇都是「模板 + 變形 + 面試時怎麼講」：

- [複雜度速查](/interview/coding/complexity-cheatsheet) — 各題型的時間/空間複雜度總表
- [Python 面試技巧](/interview/coding/python-tips-for-interview) — 我常用的 Python API 與 idiom
- [Backtracking 模板](/interview/coding/backtracking-template) — Backtracking
- [Binary Search 模板](/interview/coding/binary-search-template) — Binary Search
- [Sliding Window 模板](/interview/coding/sliding-window-template) — Sliding Window
- [Two Pointers 模板](/interview/coding/two-pointers-template) — Array & Two Pointers
- [Linked List 模板](/interview/coding/linked-list-template) — Linked List
- [Tree 遍歷模板](/interview/coding/tree-traversal-template) — Tree
- [BFS / DFS 模板](/interview/coding/bfs-dfs-template) — Graph & BFS/DFS
- [單調棧模板](/interview/coding/monotonic-stack-template) — Stack
- [Dynamic Programming 模板](/interview/coding/dynamic-programming-template) — Dynamic Programming
- [Heap / Top K 模板](/interview/coding/heap-topk-template) — Heap
- [Intervals 模板](/interview/coding/intervals-template) — Intervals

## 經典系列一起看

同一個系列從 I 做到 III，最能感受出題者是怎麼一步步加條件的 — 面試遇到沒看過的變形題，多半就是這些套路：

- **2 Sum 家族**：[1](/interview/coding/1-2-sum)、[167](/interview/coding/167-two-sum-ii-input-array-is-sorted)、[15](/interview/coding/15-3-sum)、[454](/interview/coding/454-4-sum-ii)、[653](/interview/coding/653-two-sum-iv-input-is-a-bst)（搭配 [2 Sum 面試應對策略](/interview/coding/2-sum-in-interview)）
- **Best Time to Buy and Sell Stock**：[121](/interview/coding/121-best-time-to-buy-and-sell-stock)、[122](/interview/coding/122-best-time-to-buy-and-sell-stock-ii)、[123](/interview/coding/123-best-time-to-buy-and-sell-stock-iii)、[188](/interview/coding/188-best-time-to-buy-and-sell-stock-iv)、[309](/interview/coding/309-best-time-to-buy-and-sell-stock-with-cool-down)、[714](/interview/coding/714-best-time-to-buy-and-sell-stock-with-transaction-fee)
- **House Robber**：[198](/interview/coding/198-house-robber)、[213](/interview/coding/213-house-robber-ii)、[337](/interview/coding/337-house-robber-iii)
- **Meeting Rooms 與 Intervals**：[252](/interview/coding/252-meeting-rooms)、[253](/interview/coding/253-meeting-rooms-ii)、[56](/interview/coding/56-merge-intervals)、[57](/interview/coding/57-insert-interval)
- **Course Schedule**：[207](/interview/coding/207-course-schedule)、[210](/interview/coding/210-course-schedule-ii)
- **Basic Calculator**：[224](/interview/coding/224-basic-calculator)、[227](/interview/coding/227-basic-calculator-ii)、[772](/interview/coding/772-basic-calculator-iii)
- **Word Break 與 Word Ladder**：[139](/interview/coding/139-word-break)、[140](/interview/coding/140-word-break-ii)、[127](/interview/coding/127-word-ladder)、[126](/interview/coding/126-word-ladder-ii)
- **Max Consecutive Ones**：[485](/interview/coding/485-max-consecutive-ones)、[487](/interview/coding/487-max-consecutive-ones-ii)、[1004](/interview/coding/1004-max-consecutive-ones-iii)
- **Subsets / Combination / Permutation 家族**：[78](/interview/coding/78-subsets)、[90](/interview/coding/90-subsets-ii)、[39](/interview/coding/39-combination-sum)、[40](/interview/coding/40-combination-sum-ii)、[77](/interview/coding/77-combinations)、[46](/interview/coding/46-permutations)、[47](/interview/coding/47-permutations-ii)
- **Reverse Linked List**：[206](/interview/coding/206-reverse-linked-list)、[92](/interview/coding/92-reverse-linked-list-ii)
- **Paint House**：[256](/interview/coding/256-paint-house)、[265](/interview/coding/265-paint-house-ii)
- **Range Sum Query**：[303](/interview/coding/303-range-sum-query-immutable)、[304](/interview/coding/304-range-sum-query-2d-immutable)
- **Shortest Word Distance**：[243](/interview/coding/243-shortest-word-distance)、[244](/interview/coding/244-shortest-word-distance-ii)
- **Longest Increasing Subsequence 家族**：[300](/interview/coding/300-longest-increasing-subsequence)、[673](/interview/coding/673-number-of-longest-increasing-subsequence)、[354](/interview/coding/354-russian-doll-envelopes)
- **The Maze**：[490](/interview/coding/490-the-maze)、[505](/interview/coding/505-the-maze-ii)
- **Strobogrammatic Number**：[246](/interview/coding/246-strobogrammatic-number)、[247](/interview/coding/247-strobogrammatic-number-ii)
