---
slug: "63-unique-paths-ii"
section: "coding"
title: "63. Unique Paths II"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1744173431
updated_at: 1744173447
published_at: 1744173431
---
[63\. Unique Paths II](https://leetcode.com/problems/unique-paths-ii/)

```python
class Solution:
    def uniquePathsWithObstacles(self, obstacleGrid: List[List[int]]) -> int:
        m = len(obstacleGrid)
        n = len(obstacleGrid[0])
        
        if obstacleGrid[m - 1][n - 1] == 1 or obstacleGrid[0][0] == 1:
            return 0
        
        res = [[0 for _ in range(n)] for _ in range(m)]
        
        res[0][0] = 1
        
        for i in range(1, m):
            if obstacleGrid[i][0] == 0 and res[i - 1][0] == 1:
                res[i][0] = 1
        
        for j in range(n):
            if obstacleGrid[0][j] == 0 and res[0][j - 1] == 1:
                res[0][j] = 1
            
        
        for i in range(1, m):
            for j in range(1, n):
                if obstacleGrid[i][j] == 1:
                    res[i][j] == 0
                else:
                    res[i][j] = res[i - 1][j] + res[i][j - 1]
        
        return res[m - 1][n - 1]
```