---
slug: "490-the-maze"
section: "coding"
title: "490. The Maze"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973128
updated_at: 1674973128
published_at: 1674973128
---
[490\. The Maze](https://leetcode.com/problems/the-maze/)

這一個題目可以使用廣度優先搜索來解，這一個題目的困難是在於要如何理解球的運動方向。

一般而言廣度優先搜索的探索步伐是一部，可是這個題目裡面，球會滾到撞牆為止，所以當我在座標 (row, col) 時，一樣是要往四個方向去探索，不過這個題目裡面，往四個方向探索的方式是要把球滾到撞牆為止，在去撞牆的路上，如果跨過已經走過的點的話，是可以直接跨過去的。

因此只要下個前往的座標沒有超過邊界，且不是 `1` 的話，球都可以一直滾。

接著要判斷的是，球滾到的位置之前有沒有到達過，如果說已經到達過了，代表這個座標曾經造訪過，但是到不了終點，我們就不會基於這個座標繼續執行廣度優先搜索 ，不過如果說剛好滾到的座標就是終點，那就是可以達到終點，題目可以回傳 True 。

反之如果題目已經探索完畢卻沒有走到終點，那就回傳 False 。

```python
class Solution:
    def hasPath(self, maze: List[List[int]], start: List[int], destination: List[int]) -> bool:
        if not maze or not maze[0]: return False
        rows = len(maze)
        columns = len(maze[0])
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        queue = deque([start])
        maze[start[0]][start[1]] = 2
        while queue:
            row, col = queue.popleft()
            for dr, dc in directions:
                next_r = row
                next_c = col
                while 0 <= next_r + dr < rows and 0 <= next_c + dc < columns and maze[next_r+dr][next_c+dc] != 1:
                    next_r += dr
                    next_c += dc
                if maze[next_r][next_c] == 0:       
                    if next_r == destination[0] and next_c == destination[1]:
                        return True
                    queue.append((next_r, next_c))
                    maze[next_r][next_c] = 2
        return False

```