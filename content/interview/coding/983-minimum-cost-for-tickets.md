---
slug: "983-minimum-cost-for-tickets"
section: "coding"
title: "983. Minimum Cost For Tickets"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674948988
updated_at: 1674949008
published_at: 1674948988
---
[983\. Minimum Cost For Tickets](https://leetcode.com/problems/minimum-cost-for-tickets/)

目標 `dp[i]` 是當在旅程從第 `i` 天開始，完成所有旅程所需要的最少成本。

```python
class Solution:
    def mincostTickets(self, days: List[int], costs: List[int]) -> int:
        dayset = set(days)
        m = max(days)
        costTable = {
            1: costs[0],
            7: costs[1],
            30: costs[2]
        }
        memo = {}

        def dp(day):
            if day not in memo:
                if day > m:
                    memo[day] = 0
                elif day in dayset:
                    memo[day] = min([dp(day + key) + val for key, val in costTable.items()])
                else:
                    memo[day] = dp(day+1)
            return memo[day]
        return dp(1)
```