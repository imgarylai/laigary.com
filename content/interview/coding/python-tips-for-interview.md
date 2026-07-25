---
slug: "python-tips-for-interview"
section: "coding"
title: "Python Tips for Interview"
status: "published"
pinned: false
tags: []
created_at: 1784923036
updated_at: 1784923036
published_at: 1784923035
---
這一頁整理我在題解裡反覆用到的 Python 手法 — 都是實際寫過的，每個都連到用它的那一題。面試時能少寫幾行、少出幾個 bug，就是這些小 API 的價值。

## collections：把資料結構一步到位

### `defaultdict` — 免去「key 不存在」的判斷

分組、建鄰接表時最好用，不用先檢查 key 再初始化：

```python
from collections import defaultdict
table = defaultdict(list)
for s in strs:
    table[tuple(sorted(s))].append(s)   # key 不存在時自動給 []
```

用過的題：[49. Group Anagrams](/interview/coding/49-group-anagrams)、[Graph / BFS·DFS 建鄰接表](/interview/coding/bfs-dfs-template)。計數用 `defaultdict(int)`，或直接下一個 —

### `Counter` — 計數與「取最多的前幾個」

```python
from collections import Counter
count = Counter(nums)          # {值: 次數}
count.most_common(k)           # 直接拿出現次數前 k 名
```

用過的題：[347. Top K Frequent Elements](/interview/coding/347-top-k-frequent-elements)、[75. Sort Colors](/interview/coding/75-sort-colors)、[1189. Maximum Number of Balloons](/interview/coding/1189-maximum-number-of-balloons)。

### `deque` — 兩端都 $O(1)$ 的佇列

BFS 的標準容器。**千萬不要用 `list.pop(0)`**，那是 $O(n)$：

```python
from collections import deque
q = deque([start])
q.popleft()        # O(1)；list.pop(0) 是 O(n)
q.append(x)
```

用過的題：[127. Word Ladder](/interview/coding/127-word-ladder)、[994. Rotting Oranges](/interview/coding/994-rotting-oranges)、[239. Sliding Window Maximum](/interview/coding/239-sliding-window-maximum)。細節見 [BFS / DFS 模板](/interview/coding/bfs-dfs-template)。

### `heapq` — 只有最小堆，要最大堆就取負

`heapq` 沒有最大堆。要最大堆就把值變號放進去，取出時再變回來；排序依據不是值本身時，push **tuple**：

```python
import heapq
heapq.heapify(heap)                       # O(n) 原地建堆
heapq.heappush(heap, (-dist, point))      # 取負 → 模擬最大堆
heapq.heappushpop(heap, (-dist, point))   # 推入再彈出，一步完成
```

用過的題：[973. K Closest Points to Origin](/interview/coding/973-k-closest-points-to-origin)、[215. Kth Largest Element in an Array](/interview/coding/215-kth-largest-element-in-an-array)、[295. Find Median from Data Stream](/interview/coding/295-find-median-from-data-stream)。完整套路見 [Heap / Top K 模板](/interview/coding/heap-topk-template)。

## 排序：`key` 才是重點

### `key=lambda` — 自訂排序依據

```python
points.sort(key=lambda x: x[1])   # 依每個區間的結尾排序
```

用過的題：[452. Minimum Number of Arrows to Burst Balloons](/interview/coding/452-minimum-number-of-arrows-to-burst-balloons)、[56. Merge Intervals](/interview/coding/56-merge-intervals)。Intervals 題幾乎第一步都是排序，見 [Intervals 模板](/interview/coding/intervals-template)。

### tuple key — 多關鍵字排序，正負號控制升降

回傳 tuple 就是「先比第一個、再比第二個」；**某一維要降冪就把值取負**：

```python
# 第一維升冪，第二維降冪
envelopes.sort(key=lambda x: (x[0], -x[1]))
```

用過的題：[354. Russian Doll Envelopes](/interview/coding/354-russian-doll-envelopes) — 這個「一維升、一維降」的技巧正是把二維問題壓成一維 LIS 的關鍵。

## 反向遍歷：不用手算索引

你提到的 `reversed(range(...))` 就在這類。兩種寫法等價，我偏好 `reversed(range(...))` 因為讀起來就是「從後往前」：

```python
for p in reversed(range(m + n)):   # m+n-1, m+n-2, ..., 0
    ...
# 等價於：
for p in range(m + n - 1, -1, -1):
```

用過的題：[88. Merge Sorted Array](/interview/coding/88-merge-sorted-array)（從後往前填，避免覆蓋還沒讀的元素）、[739. Daily Temperatures](/interview/coding/739-daily-temperatures)、[516. Longest Palindromic Subsequence](/interview/coding/516-longest-palindromic-subsequence)。

## 哨兵與初始化

### `float('inf')` — 求最小值的起點

求最小值時初始化成無窮大，第一個真實值就會取代它；求最大值用 `float('-inf')`：

```python
res = float('inf')
for cost in costs:
    res = min(res, cost)
```

用過的題：[265. Paint House II](/interview/coding/265-paint-house-ii)、[256. Paint House](/interview/coding/256-paint-house)。

### 二維陣列初始化 — 別用 `[[0]*n]*m`

`[[0]*n]*m` 會讓每一列共用同一個 list，改一個全部跟著變。要用 comprehension：

```python
grid = [[0] * n for _ in range(m)]   # 每列各自獨立
```

用過的題：[63. Unique Paths II](/interview/coding/63-unique-paths-ii)、[289. Game of Life](/interview/coding/289-game-of-life)。

## 字串處理

### `isdigit()` / `isalnum()` / `isalpha()` — 字元分類

Python 沒有 char 型別，單一字元就是長度 1 的 str，所以這些方法可以直接對 `s[i]` 或迴圈變數呼叫。逐字掃描解析時最常用 `isdigit()`：

```python
while index < len(s) and s[index].isdigit():   # 把連續數字整個讀完
    num = num * 10 + int(s[index])
    index += 1
```

用過的題：[224. Basic Calculator](/interview/coding/224-basic-calculator)、[227. Basic Calculator II](/interview/coding/227-basic-calculator-ii)、[772. Basic Calculator III](/interview/coding/772-basic-calculator-iii)、[394. Decode String](/interview/coding/394-decode-string)、[726. Number of Atoms](/interview/coding/726-number-of-atoms) — 凡是「自己寫 parser」的題都靠它。

`isalnum()` 是「字母或數字」，也就是**排除空白和標點**，前處理一行就搞定：

```python
s = "".join([c.lower() for c in s if c.isalnum()])   # 只留字母數字並轉小寫
```

用過的題：[125. Valid Palindrome](/interview/coding/125-valid-palindrome)。

`isalpha()` 只認字母、`isspace()` 判空白：

```python
if not c.isdigit() and not c.isspace():   # 既不是數字也不是空白 → 運算子
```

用過的題：[726. Number of Atoms](/interview/coding/726-number-of-atoms)、[937. Reorder Data in Log Files](/interview/coding/937-reorder-data-in-log-files)、[224. Basic Calculator](/interview/coding/224-basic-calculator)。

### `lower()` / `upper()` / `islower()` / `isupper()` — 大小寫

比較時兩邊都轉同一種大小寫，就是大小寫不敏感的比較；`islower()` / `isupper()` 則是判斷某個字元本身的大小寫：

```python
if res[-1].upper() == c.upper():                 # 同一個字母（不分大小寫）
if res[-1].isupper() and c.islower(): ...        # 一大一小 → 相鄰且大小寫相反
```

用過的題：[1544. Make The String Great](/interview/coding/1544-make-the-string-great)（判斷相鄰兩字元是否「同字母但大小寫相反」）、[125. Valid Palindrome](/interview/coding/125-valid-palindrome)。

### `split()` — 切字串，不用自己掃分隔符

**不給參數時，是依「任意連續空白」切並自動丟掉空字串** — 這跟 `split(' ')` 不一樣，後者遇到連續空白會產生空字串。處理「反轉句子中的單字」這類題目時，這個差別就是省掉一整段清理程式碼：

```python
" ".join(reversed(s.split()))     # 多餘空白自動消失
path.split('/')                   # 依指定分隔符切，空段落要自己過濾
data.split(',')                   # 反序列化
log.split(' ', 1)                 # maxsplit=1：只切第一個空白，切成兩段
```

用過的題：[151. Reverse Words in a String](/interview/coding/151-reverse-words-in-a-string)、[71. Simplify Path](/interview/coding/71-simplify-path)、[588. Design In-Memory File System](/interview/coding/588-design-in-memory-file-system)、[1166. Design File System](/interview/coding/1166-design-file-system)、[297. Serialize and Deserialize Binary Tree](/interview/coding/297-serialize-and-deserialize-binary-tree)、[937. Reorder Data in Log Files](/interview/coding/937-reorder-data-in-log-files)（用 `maxsplit=1` 把 id 和內容分開）、[648. Replace Words](/interview/coding/648-replace-words)。

### `''.join()` — 組字串別用 `+=`

字串是不可變的，迴圈裡 `s += c` 是 $O(n^2)$。收集進 list 最後 `join`：

```python
result = ''.join(chars)   # O(n)
```

用過的題：[93. Restore IP Addresses](/interview/coding/93-restore-ip-addresses)、[71. Simplify Path](/interview/coding/71-simplify-path)、[301. Remove Invalid Parentheses](/interview/coding/301-remove-invalid-parentheses)。

### `ord()` / `chr()` — 字元與數字互換

把字母映射成 0–25 的陣列索引，比 dict 快也省空間：

```python
idx = ord(c) - ord('a')   # 'a'→0, 'b'→1, ...
```

用過的題：[127. Word Ladder](/interview/coding/127-word-ladder)、[316. Remove Duplicate Letters](/interview/coding/316-remove-duplicate-letters)。

### `[::-1]` — 一行反轉

```python
s[::-1]        # 反轉字串/list
```

用過的題：[557. Reverse Words in a String III](/interview/coding/557-reverse-words-in-a-string-iii)、[103. Binary Tree Zigzag Level Order Traversal](/interview/coding/103-binary-tree-zigzag-level-order-traversal)（奇數層反轉）。注意這會建新物件；要原地反轉 list 用 `list.reverse()`。

### `zfill()` — 補零到固定寬度

自己設計編碼格式時，長度前綴補成固定寬度，解碼端就能無腦讀固定位數：

```python
meta = str(len(s)).zfill(self.size)   # 5 → '005'
```

用過的題：[271. Encode and Decode Strings](/interview/coding/271-encode-and-decode-strings)。

## `bisect` — 在排序陣列上二分，不用自己寫

已經排序好的陣列要找「插入位置」或「第一個 ≥ target 的索引」，不用手刻二分，`bisect` 一行搞定：

```python
from bisect import bisect_left, bisect_right, insort

bisect_left(arr, x)    # 第一個 >= x 的索引（左邊界）
bisect_right(arr, x)   # 第一個 > x 的索引（右邊界）
insort(arr, x)         # 插入並保持有序（插入本身是 O(n)）
```

`bisect_left` / `bisect_right` 對應到我在 [Binary Search 模板](/interview/coding/binary-search-template) 裡手寫的 lower/upper bound — 面試時如果不要求自己實作二分，直接用它最省事。

用過的題：[1751. Maximum Number of Events That Can Be Attended II](/interview/coding/1751-maximum-number-of-events-that-can-be-attended-ii)（`bisect_left(start_days, end + 1)` 找下一個能參加的活動）。

另外一個經典用法是 LIS：把「維護一個遞增的 tails 陣列、二分找替換位置」交給 `bisect_left`，就能把 [300. Longest Increasing Subsequence](/interview/coding/300-longest-increasing-subsequence) 從 $O(n^2)$ 降到 $O(n \log n)$。

## 遞迴與快取

### `@cache` — 一行加上記憶化

DP 最快的起手式：先寫暴力遞迴，再加 `@cache`，就自動有 memoization，不用手動管表格和遍歷順序：

```python
from functools import cache

@cache
def dp(i, prev):
    if i == n:
        return 0
    ...
```

用過的題：[265. Paint House II](/interview/coding/265-paint-house-ii)、[70. Climbing Stairs](/interview/coding/70-climbing-stairs)。這個「暴力遞迴 → 加 cache」的順序見 [Dynamic Programming 模板](/interview/coding/dynamic-programming-template)。

### 巢狀函式 + `nonlocal` — 遞迴時共享外層變數

把遞迴函式定義在主函式內，就能直接用外層的 `nums`、`n`、`grid`，不用一路傳參；要**修改**外層變數則加 `nonlocal`：

```python
def kthSmallest(self, root, k):
    ans = None
    def inorder(node):
        nonlocal ans, k    # 要改外層變數才需要 nonlocal
        ...
    inorder(root)
    return ans
```

用過的題：[230. Kth Smallest Element in a BST](/interview/coding/230-kth-smallest-element-in-a-bst)、[394. Decode String](/interview/coding/394-decode-string)、[99. Recover Binary Search Tree](/interview/coding/99-recover-binary-search-tree)。

## 幾個小手法

### XOR 消消樂 — 找落單的數

`a ^ a == 0`、`a ^ 0 == a`，所以把所有數 XOR 起來，成對的抵銷，剩下的就是答案。$O(1)$ 空間：

```python
ans = 0
for num in nums:
    ans ^= num
```

用過的題：[136. Single Number](/interview/coding/136-single-number)。

### 多重賦值與交換 — 不用暫存變數

```python
a, b = b, a + b      # 右邊先整個算好，再一次賦值
prev = curr = None   # 一次初始化多個
```

用過的題：[509. Fibonacci Number](/interview/coding/509-fibonacci-number)、[206. Reverse Linked List](/interview/coding/206-reverse-linked-list)。

### 負索引 — 直接取尾端

```python
nums[-1]      # 最後一個
stack[-1]     # 看棧頂（不彈出）
```

單調棧裡 `stack[-1]` 看棧頂是最常見的用法，見 [單調棧模板](/interview/coding/monotonic-stack-template)。

---

回到總索引 → [Coding Interview Preparation](/interview/coding/coding-interview-preparation)
