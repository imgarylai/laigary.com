---
slug: "256-paint-house"
section: "coding"
title: "256. Paint House"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1767415529
updated_at: 1767415657
published_at: 1767415529
---
[256\. Paint House](https://leetcode.com/problems/paint-house/)

```python
class Solution:
    def minCost(self, costs: List[List[int]]) -> int:
        if not costs:
            return 0
        n = len(costs)

        @cache
        def helper(i, prev):
            if i == n:
                return 0
            if prev == 0:
                return min(
                    costs[i][1] + helper(i + 1, 1),
                    costs[i][2] + helper(i + 1, 2),
                )
            elif prev == 1:
                return min(
                    costs[i][0] + helper(i + 1, 0),
                    costs[i][2] + helper(i + 1, 2),
                )
            elif prev == 2:
                return min(
                    costs[i][0] + helper(i + 1, 0),
                    costs[i][1] + helper(i + 1, 1),
                )
            else:
                return min(
                    costs[i][0] + helper(i + 1, 0),
                    costs[i][1] + helper(i + 1, 1),
                    costs[i][2] + helper(i + 1, 2)
                )
        
        return helper(0, float('inf'))
```