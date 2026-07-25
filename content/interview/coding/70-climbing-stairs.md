---
slug: "70-climbing-stairs"
section: "coding"
title: "70. Climbing Stairs"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674944416
updated_at: 1784954925
published_at: 1674944416
---
[70. Climbing Stairs](https://leetcode.com/problems/climbing-stairs/)

## 遞推式怎麼來的

站在第 `n` 階，回頭看只有兩種可能：

- 從第 `n-1` 階跨了 **1** 階上來
- 從第 `n-2` 階跨了 **2** 階上來

沒有第三種可能，因為題目只允許一次跨 1 或 2 階。所以「到第 `n` 階的走法數」就是這兩個來源的走法數相加：如果第 `n-2` 階有 `k` 種走法到達、第 `n-1` 階有 `w` 種，那第 `n` 階就有 `k + w` 種。

$$f(n) = f(n-1) + f(n-2)$$

```py
class Solution:
    def climbStairs(self, n: int) -> int:
        @cache
        def helper(k):
            if k == 1:
                return 1
            if k == 2:
                return 2
            return helper(k - 1) + helper(k - 2)
        return helper(n)
```

## 為什麼不用「加一」

我第一次想的時候卡在這裡：從 `n-1` 階跨一階上來，這個「跨」的動作本身算不算多出一種新走法？式子要不要寫成 $f(n) = f(n-1) + 1 + f(n-2) + 1$？

**不用。** 因為我們數的是「**完整走法的數量**」，不是「走了幾步」。從 `n-1` 階跨上來這個動作，只是把 `n-1` 階的每一種走法各接上一步，走法的**數量沒有變** — 原本 `w` 種，接上去還是 `w` 種，只是每種都長了一階。

反過來檢查最能說明這件事：如果題目改成「一次只能走 1 階」，那走到 `n` 階只有 **1** 種走法（一階一階走上去），不是 `n` 種。走了 `n` 步，但那是同一種走法。這題之所以答案會變多，純粹是因為「跨 1 階」和「跨 2 階」可以交錯出不同的排列，不是因為階數多。

## 和斐波那契的關係：`n` 差一位

這題的遞推式和 [509. Fibonacci Number](/interview/coding/509-fibonacci-number) 一模一樣，但**兩邊的 `n` 不是同一個 `n`** — 這是最容易寫錯的地方，直接把 509 的程式碼複製過來會全錯：


| `n`              | 1   | 2   | 3   | 4   | 5   | 6   |
| ---------------- | --- | --- | --- | --- | --- | --- |
| `climbStairs(n)` | 1   | 2   | 3   | 5   | 8   | 13  |
| $F(n)$           | 1   | 1   | 2   | 3   | 5   | 8   |


$$\text{climbStairs}(n) = F(n+1)$$

差異來自初始值：斐波那契是 $F(0)=0, F(1)=1$，而爬樓梯是 $f(1)=1, f(2)=2$（走到第 2 階有「1+1」和「跨2」兩種）。所以**照爬樓梯自己的初始值寫，不要套斐波那契的**。

## 程式碼

只需要前兩個值，用兩個變數滾動就好，空間 $O(1)$：

```python
class Solution:
    def climbStairs(self, n: int) -> int:
        prev, curr = 1, 1        # f(0)=1（站在原地算一種）、f(1)=1
        for _ in range(n - 1):
            prev, curr = curr, prev + curr
        return curr
```

如果想留下整張表（例如面試官後續要問「印出所有走法」或改成一次能跨 `k` 階），寫成 dp 陣列：

```python
class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2:
            return n
        dp = [0] * (n + 1)
        dp[1], dp[2] = 1, 2      # 關鍵：dp[2] = 2，不是斐波那契的 1
        for i in range(3, n + 1):
            dp[i] = dp[i-1] + dp[i-2]
        return dp[n]
```

時間複雜度 $O(n)$、空間分別是 $O(1)$ 和 $O(n)$。

`prev, curr = curr, prev + curr` 這種一行交換見 [Python 面試技巧](/interview/coding/python-tips-for-interview)；這題也是「先寫暴力遞迴再加 `@cache`」的最小範例，見 [Dynamic Programming 模板](/interview/coding/dynamic-programming-template)。