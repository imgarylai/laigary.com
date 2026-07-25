---
slug: "309-best-time-to-buy-and-sell-stock-with-cool-down"
section: "coding"
title: "309. Best Time to Buy and Sell Stock with Cool down"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973114
updated_at: 1720543894
published_at: 1674973114
---
[309\. Best Time to Buy and Sell Stock with Cool down](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/)

## 自頂向下

(remaining 是不必要的)

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        @cache
        def dfs(i, hold, remaining, cooldown):
            if remaining == 0:
                return 0;
            if i == len(prices):
                return 0
            
            if cooldown:
                return dfs(i + 1, False, remaining, False)

            do_nothing = dfs(i + 1, hold, remaining, False)

            do_something = 0

            if hold:
                do_something = prices[i] + dfs(i + 1, False, remaining, True)
            else:
                do_something = -prices[i] + dfs(i + 1, True, remaining, False)

            return max(do_nothing, do_something)

        return dfs(0, False, 1, False)
```

## 自底向上

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        if len(prices) < 2:
            return 0

        buys = [float('-inf')] * len(prices)
        sells = [0] * len(prices)

        for i in range(len(prices)):
            buys[i] = max(buys[i-1] if i > 0 else -prices[i], (sells[i-2] if i > 1 else 0) - prices[i])
            sells[i] = max(sells[i-1] if i > 0 else 0, (buys[i-1] + prices[i] if i > 0 else 0))
        return sells[-1]

```