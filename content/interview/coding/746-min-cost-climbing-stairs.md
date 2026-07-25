---
slug: "746-min-cost-climbing-stairs"
section: "coding"
title: "746. Min Cost Climbing Stairs"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1704429225
updated_at: 1761773961
published_at: 1704429225
---
[746\. Min Cost Climbing Stairs](https://leetcode.com/problems/min-cost-climbing-stairs/)

## 自頂向下

```python
class Solution:
    def minCostClimbingStairs(self, cost: List[int]) -> int:
         
            @cache
            def dp(i):
                if i > len(cost):
                    return float('inf')
                if i == len(cost):
                    return 0
                curr = cost[i]
                return curr + min(dp(i + 1), dp(i + 2))
            
            return min(dp(0), dp(1))
```

## 自底向上

```python
class Solution:
    def minCostClimbingStairs(self, cost: List[int]) -> int:
        costs = [0] * (len(cost) + 1)
        costs[0] = cost[0]
        costs[1] = cost[1]
        cost.append(0)
        
        i = 2
        while i < len(costs):
            costs[i] = cost[i] + min(costs[i-1], costs[i-2])
            i += 1

        return costs[-1]
```