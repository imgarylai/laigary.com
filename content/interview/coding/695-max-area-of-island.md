---
slug: "695-max-area-of-island"
section: "coding"
title: "695. Max Area of Island"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1743051664
updated_at: 1743051682
published_at: 1743051664
---
[695\. Max Area of Island](https://leetcode.com/problems/max-area-of-island/)

```python
class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        
        rows = len(grid)
        cols = len(grid[0])
        
        directions = [(1, 0), (0, 1), (-1, 0), (0, -1)]
        
        def dfs(row, col):
            grid[row][col] = "#"
            count = 1
            for dr, dc in directions:
                next_row = row + dr
                next_col = col + dc
                if 0 <= next_row < rows and 0 <= next_col < cols and grid[next_row][next_col] == 1:
                    count += dfs(next_row, next_col)
            return count
        
        
        res = 0
        for row in range(rows):
            for col in range(cols):
                if grid[row][col] == 1:
                    count = dfs(row, col)
                    res = max(res, count)
        
        return res
                    
                    
```