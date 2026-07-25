---
slug: "1219-path-with-maximum-gold"
section: "coding"
title: "1219. Path with Maximum Gold"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674845271
updated_at: 1674845292
published_at: 1674845271
---
[1219\. Path with Maximum Gold](https://leetcode.com/problems/path-with-maximum-gold/)

```python
class Solution:
    def getMaximumGold(self, grid: List[List[int]]) -> int:

        rows = len(grid)
        cols = len(grid[0])
        ans = float('-inf')
        directions = [(1,0),(-1,0),(0,1),(0,-1)]

        def backtrack(curr, row, col):
            nonlocal ans
            if grid[row][col] == 0:
                return
            current_gold = grid[row][col]
            curr += current_gold
            ans = max(ans, curr)
            grid[row][col] = 0

            for r, c in directions:
                dr = row + r
                dc = col + c
                if 0 <= dr < rows and 0 <= dc < cols:
                    backtrack(curr, dr, dc)
            grid[row][col] = current_gold


        for row in range(rows):
            for col in range(cols):
                backtrack(0, row, col)

        return ans
```