---
slug: "265-paint-house-ii"
section: "coding"
title: "265. Paint House II"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1767415677
updated_at: 1767415770
published_at: 1767415677
---
[265\. Paint House II](https://leetcode.com/problems/paint-house-ii/)

我是基於 [256\. Paint House](/interview/coding/256-paint-house) 去將之前的狀態給泛化，不過這樣的時間雜度是 $O(n * k^2)$。

```python
class Solution:
    def minCostII(self, costs: List[List[int]]) -> int:
        if not costs:
            return 0
        
        n = len(costs)
        k = len(costs[0])  # 顏色數量

        @cache
        def helper(i, prev_color):
            # 基底狀況：所有房子都塗完了
            if i == n:
                return 0
            
            res = float('inf')
            
            # 遍歷所有可能的顏色 j
            for j in range(k):
                # 只要目前的顏色不等於前一間房子的顏色
                if j != prev_color:
                    res = min(res, costs[i][j] + helper(i + 1, j))
            
            return res
        
        # 初始調用時，prev_color 可以設為 -1，代表第一間房可以選任何顏色
        return helper(0, -1)
```