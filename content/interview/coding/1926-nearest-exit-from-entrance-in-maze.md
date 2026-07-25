---
slug: "1926-nearest-exit-from-entrance-in-maze"
section: "coding"
title: "1926. Nearest Exit from Entrance in Maze"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Graph"]
created_at: 1746336568
updated_at: 1746338687
published_at: 1746336568
---
[1926\. Nearest Exit from Entrance in Maze](https://leetcode.com/problems/nearest-exit-from-entrance-in-maze/)

這個問題屬於 BFS 的問題

```python 
class Solution:
    def nearestExit(self, maze: List[List[str]], entrance: List[int]) -> int:
        
        directions = [(1, 0), (0, 1), (-1, 0), (0, -1)]
        rows = len(maze)
        cols = len(maze[0])
        res = 0
        q = deque([entrance])
        maze[entrance[0]][entrance[1]] = '+' 
        
        while q:
            n = len(q)
            res += 1
            for i in range(n):
                x, y = q.popleft()
                maze[x][y] = '+'
                for dx, dy in directions:
                    if 0 <= x + dx < rows and 0 <= y + dy < cols:
                        if maze[x + dx][y + dy] == '.':
                            if x + dx == 0 or x + dx == rows - 1 or y + dy == 0 or y + dy == cols - 1:
                                return res
                            else:
                                q.append([x + dx, y + dy])      
                                maze[x + dx][y + dy] = '+' 
        return -1   
```