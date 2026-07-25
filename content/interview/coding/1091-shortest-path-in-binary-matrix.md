---
slug: "1091-shortest-path-in-binary-matrix"
section: "coding"
title: "1091. Shortest Path in Binary Matrix"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Graph"]
created_at: 1709367451
updated_at: 1709367649
published_at: 1709367451
---
[1091\. Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/)

可以先練習這些題目

-   [200\. Number of Islands](/interview/coding/200-number-of-islands)
-   [329\. Longest Increasing Path in a Matrix](/interview/coding/329-longest-increasing-path-in-a-matrix)

這個題目只是把 directions 複雜化了。

```python
class Solution:
    def shortestPathBinaryMatrix(self, grid: List[List[int]]) -> int:
        
        rows = len(grid) - 1
        cols = len(grid[0]) - 1

        if grid[0][0] != 0 or grid[rows][cols] != 0:
            return -1

        directions = [
            (-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]

        queue = deque()
        queue.append((0, 0))
        grid[0][0] = 1 
        
        while queue:
            row, col = queue.popleft()
            distance = grid[row][col]
            if (row, col) == (rows, cols):
                return distance

            neighbors = []
            for dx, dy in directions:
                x = row + dx
                y = col + dy
                if not(0 <= x <= rows and 0 <= y <= cols):
                    continue
                if grid[x][y] != 0:
                    continue
                neighbors.append((x, y))
            
            for x, y in neighbors:
                grid[x][y] = distance + 1
                queue.append((x, y))
            
        return -1
```