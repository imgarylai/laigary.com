---
slug: "931-minimum-falling-path-sum"
section: "coding"
title: "931. Minimum Falling Path Sum"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1744175497
updated_at: 1744175625
published_at: 1744175497
---
[931\. Minimum Falling Path Sum](https://leetcode.com/problems/minimum-falling-path-sum/)

```python
class Solution:
    def minFallingPathSum(self, matrix: List[List[int]]) -> int:
        
        rows = len(matrix)
        cols = len(matrix[0])
        
        @cache
        def dp(row, col):
            if row >= rows:
                return 0
            if col < 0 or col >= cols:
                return float('inf')
            
            return matrix[row][col] + min(dp(row + 1, col - 1), dp(row + 1, col), dp(row + 1, col + 1))
            
        
        res = float('inf')
        for i in range(cols):
            res = min(res, dp(0, i))
        
        return res
```