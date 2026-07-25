---
slug: "714-best-time-to-buy-and-sell-stock-with-transaction-fee"
section: "coding"
title: "714. Best Time to Buy and Sell Stock with Transaction Fee"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973113
updated_at: 1674973113
published_at: 1674973113
---
[714\. Best Time to Buy and Sell Stock with Transaction Fee](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/)

```python
class Solution:
    def maxProfit(self, prices: List[int], fee: int) -> int:
        if len(prices) < 2:
            return 0

        buys = [float('-inf')] * len(prices) 
        sells = [0] * len(prices) 

        for i in range(len(prices)):
            if i == 0:
                buys[i] = max(buys[i], 0 - prices[i] - fee)
            else:
                buys[i] = max(buys[i-1], sells[i-1] - prices[i] - fee)
            sells[i] = max(sells[i-1], buys[i-1] + prices[i])
        return sells[-1]

```