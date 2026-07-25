---
slug: "122-best-time-to-buy-and-sell-stock-ii"
section: "coding"
title: "122. Best Time to Buy and Sell Stock II"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973113
updated_at: 1674973113
published_at: 1674973113
---
[122\. Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/)

這個題目是每天都可以買賣股票，但是最多只能同時持有一股的股票要買之前要先賣掉股票。

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        if len(prices) < 2:
            return 0

        buys = [float('-inf')] * len(prices) 
        sells = [0] * len(prices) 
        buys[0] = -prices[0]

        for i in range(1, len(prices)):
            buys[i] = max(buys[i-1], sells[i-1] - prices[i])
            sells[i] = max(sells[i-1], buys[i-1] + prices[i])

        return sells[-1]

```
```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        if len(prices) < 2:
            return 0

        buys = [float('-inf')] * len(prices) 
        sells = [0] * len(prices) 

        for i in range(len(prices)):
            if i == 0:
                buys[i] = max(buys[i], 0 - prices[i])
            else:
                buys[i] = max(buys[i-1], sells[i-1] - prices[i])
            sells[i] = max(sells[i-1], buys[i-1] + prices[i])
        return sells[-1]

```