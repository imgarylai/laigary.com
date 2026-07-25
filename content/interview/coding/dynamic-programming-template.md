---
slug: "dynamic-programming-template"
section: "coding"
title: "Dynamic Programming 模板"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1784876687
updated_at: 1784876687
published_at: 1784876687
---
DP 沒有一段能照抄的 code，但有一套固定的**思考順序**。面試時照這個順序講，比急著寫表格有用得多。

## 四個步驟

1. **狀態定義** — `dp[i]` 代表什麼？講不清楚就還沒想通，別動手
2. **轉移方程** — `dp[i]` 怎麼從更小的子問題組出來
3. **初始值** — base case 是什麼，邊界從哪裡開始
4. **遍歷順序** — 算 `dp[i]` 時它依賴的格子必須都已經算好了

## 從暴力遞迴開始，不要直接寫表格

面試時最穩的路徑是「暴力遞迴 → 加 memo → （需要時）轉成迭代」。第一步能寫出來，就已經拿到分數了：

```python
from functools import cache

@cache                               # 這一行就是 memoization
def dp(i):
    if i < 0:
        return 0                     # base case
    return max(dp(i - 1), dp(i - 2) + nums[i])
```

`@cache` 讓你把力氣花在**狀態和轉移**上，不用同時處理遍歷順序 — 順序由遞迴自己決定。想不出遍歷順序的時候，這是保命符。

例題：[70. Climbing Stairs](/interview/coding/70-climbing-stairs)、[198. House Robber](/interview/coding/198-house-robber)

## 一維：當前只依賴前幾格

```python
dp = [0] * (n + 1)
dp[0] = base
for i in range(1, n + 1):
    dp[i] = f(dp[i - 1], dp[i - 2], ...)
return dp[n]
```

只依賴前一兩格時可以**滾動變數**把空間降到 $O(1)$ — 面試官問「還能再優化嗎」十次有八次是問這個：

```python
prev, curr = 0, 0
for x in nums:
    prev, curr = curr, max(curr, prev + x)
```

例題：[322. Coin Change](/interview/coding/322-coin-change)、[139. Word Break](/interview/coding/139-word-break)、[300. Longest Increasing Subsequence](/interview/coding/300-longest-increasing-subsequence)

## 二維：兩個序列或網格

兩個字串比對時，`dp[i][j]` 幾乎都是「s1 的前 i 個和 s2 的前 j 個」的答案，**多開一行一列**放空字串的 base case 會讓邊界乾淨很多：

```python
dp = [[0] * (n + 1) for _ in range(m + 1)]
for i in range(1, m + 1):
    for j in range(1, n + 1):
        if s1[i - 1] == s2[j - 1]:           # 注意索引差 1
            dp[i][j] = dp[i - 1][j - 1] + 1
        else:
            dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
```

例題：[1143. Longest Common Subsequence](/interview/coding/1143-longest-common-subsequence)、[72. Edit Distance](/interview/coding/72-edit-distance)、[62. Unique Paths](/interview/coding/62-unique-paths)

## 背包：兩層迴圈的順序決定題型

物品在外層、容量在內層。**容量正序 = 每個物品可以拿無限次；容量逆序 = 每個物品只能拿一次**：

```python
for item in items:
    for w in range(capacity, item - 1, -1):   # 逆序 → 0/1 背包
        dp[w] = max(dp[w], dp[w - item] + value)
```

順序寫反是 DP 最常見的錯誤，而且不會報錯、只會給錯答案 — 記住這一條省很多 debug 時間。

例題：[416. Partition Equal Subset Sum](/interview/coding/416-partition-equal-subset-sum)、[518. Coin Change 2](/interview/coding/518-coin-change-2)

## 多狀態：一格存好幾個值

股票、打家劫舍這類題目，同一個 `i` 有好幾種「身分」（持股 / 不持股 / 冷凍期），就把狀態擴充成 `dp[i][state]`：

```python
hold = -prices[0]        # 手上有股票的最大利潤
sold = 0                 # 手上沒股票的最大利潤
for p in prices[1:]:
    hold, sold = max(hold, sold - p), max(sold, hold + p)
```

例題：[121. Best Time to Buy and Sell Stock](/interview/coding/121-best-time-to-buy-and-sell-stock)、[309. Best Time to Buy and Sell Stock with Cool Down](/interview/coding/309-best-time-to-buy-and-sell-stock-with-cool-down)

## 面試時的講法

先講狀態定義，並且**用一句話說完** — 「`dp[i]` 是以 i 結尾的最長遞增子序列長度」。定義講對了，轉移方程通常自己就浮出來了；卡住的時候幾乎都是因為狀態定義得不夠精確（例如漏了「以 i 結尾」這個限制）。寫完記得問自己：初始值對嗎？回傳的是 `dp[n]` 還是 `max(dp)`？

其他例題：[5. Longest Palindromic Substring](/interview/coding/5-longest-palindromic-substring)、[329. Longest Increasing Path in a Matrix](/interview/coding/329-longest-increasing-path-in-a-matrix)

更多題目 → [#Dynamic Programming](/interview/coding?tag=Dynamic%20Programming)
