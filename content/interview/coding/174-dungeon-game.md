---
slug: "174-dungeon-game"
section: "coding"
title: "174. Dungeon Game"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674944801
updated_at: 1765262252
published_at: 1674944801
---
[174\. Dungeon Game](https://leetcode.com/problems/dungeon-game/)

```python
class Solution:
    def calculateMinimumHP(self, dungeon: List[List[int]]) -> int:

        rows = len(dungeon)
        cols = len(dungeon[0])
        
        @cache
        def helper(row, col):
            if row == rows - 1 and col == cols - 1:
                return 1 if dungeon[row][col] >= 0 else -dungeon[row][col] + 1

            if row == rows or col == cols:
                return float('inf')
            
            res = min(helper(row + 1, col), helper(row, col + 1)) - dungeon[row][col]
            if res <= 0:
                return 1
            else:
                return res

        return helper(0, 0)
```