---
slug: "200-number-of-islands"
section: "coding"
title: "200. Number of Islands"
status: "published"
pinned: false
tags: []
created_at: 1674842631
updated_at: 1674842716
published_at: 1674842631
---
[200\. Number of Islands](https://leetcode.com/problems/number-of-islands/)

這一題的重點在於於圖形中，進行深度優先搜索或是廣度優先搜索的遍歷。

今天的題目條件在於，如果一個陸地屬於一個島嶼的話，那該陸地一定是與其他陸地的四個方向之一有相連，要計算出有幾個島嶼，我只要站在島嶼上的任何一塊陸地，把該島嶼全部都標記成已經造訪過，那我就可以確定這個島嶼已經造訪完畢，計數器加一，接著再繼續找到下一個尚未被標記的陸地即可。

## 深度優先搜索

```python
class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        rows = len(grid)
        cols = len(grid[0])
        directions = [(1, 0), (0, 1), (-1, 0), (0, -1)]
        
        def dfs(row, col):
            grid[row][col] = '#'
            for dr, dc in directions:
                next_row = row+dr
                next_col = col+dc
                if 0 <= next_row < rows and 0 <= next_col < cols and grid[next_row][next_col] == '1':
                    dfs(next_row, next_col)
                    
        islands = 0
        
        for row in range(rows):
            for col in range(cols):
                if grid[row][col] == '1':
                    islands += 1
                    dfs(row, col)
                    
        return islands 
```

## 廣度優先搜索

```python
class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid or not grid[0]:
            return 0

        rows = len(grid)
        cols = len(grid[0])
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        islands = 0
        
        def bfs(i, j):
            queue = deque([(i, j)])
            while queue:
                row, col = queue.popleft()
                grid[row][col] = '#'
                for dr, dc in directions:
                    new_row, new_col = row + dr, col + dc
                    if 0 <= new_row < rows and 0 <= new_col < cols and grid[new_row][new_col] == "1":
                        queue.append((new_row, new_col))
                        grid[new_row][new_col] = '#'

        for i in range(rows):
            for j in range(cols):
                if grid[i][j] == "1":
                    islands += 1
                    bfs(i, j)
                    
        return islands
```