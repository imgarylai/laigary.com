---
slug: "188-best-time-to-buy-and-sell-stock-iv"
section: "coding"
title: "188. Best Time to Buy and Sell Stock IV"
status: "published"
pinned: false
tags: ["Classic", "Dynamic Programming"]
created_at: 1674973113
updated_at: 1707606865
published_at: 1674973113
---
[188\. Best Time to Buy and Sell Stock IV](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv)

## 自頂向下

```python
class Solution:
    def maxProfit(self, k: int, prices: List[int]) -> int:

        @cache
        def dfs(i, hold, remaining):
            if remaining == 0:
                return 0
            if i == len(prices):
                return 0

            do_nothing = dfs(i + 1, hold, remaining)

            do_something = 0

            if hold:
                do_something = prices[i] + dfs(i + 1, False, remaining - 1)
            else:
                do_something = -prices[i] + dfs(i + 1, True, remaining)

            return max(do_nothing, do_something)

        return dfs(0, False, k)
```

## 自底向上

```python
class Solution:
    def maxProfit(self, k: int, prices: List[int]) -> int:
        if len(prices) < 2 or k < 1:
            return 0

        if k > len(prices)//2:
            max_profit = 0
            for i in range(1, len(prices)):
                max_profit += max(0, prices[i] - prices[i-1])
            return max_profit

        buys = [float('-inf')] * k
        sells = [0] * k

        for price in prices:
            for i in range(k):
                if i == 0:
                    buys[i] = max(buys[i], 0 - price)
                else:
                    buys[i] = max(buys[i], sells[i-1] - price)
                sells[i] = max(sells[i], buys[i] + price)
        return sells[-1]

```