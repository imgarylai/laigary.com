---
slug: "2218-maximum-value-of-k-coins-from-piles"
section: "coding"
title: "2218. Maximum Value of K Coins From Piles"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1744042103
updated_at: 1744042156
published_at: 1744042103
---
[2218\. Maximum Value of K Coins From Piles](https://leetcode.com/problems/maximum-value-of-k-coins-from-piles/)

這一個題目和 [188\. Best Time to Buy and Sell Stock IV](/interview/coding/188-best-time-to-buy-and-sell-stock-iv) 很類似，同時有兩件事情需要做決策。

```python
class Solution:
    def maxValueOfCoins(self, piles: List[List[int]], k: int) -> int:
        
        @cache
        def dp(i, remaining):
            if i == len(piles):
                return 0
            if remaining == 0:
                return 0
            do_nothing = dp(i + 1, remaining)

            do_something = 0
            curr = 0
            for j in range(min(remaining, len(piles[i]))):
                curr += piles[i][j]
                do_something = max(do_something, curr + dp(i + 1, remaining - j - 1))
            
            return max(do_nothing, do_something)
        
        return dp(0, k)
```