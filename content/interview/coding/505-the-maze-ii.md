---
slug: "505-the-maze-ii"
section: "coding"
title: "505. The Maze II"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973110
updated_at: 1674973110
published_at: 1674973110
---
[505\. The Maze II](https://leetcode.com/problems/the-maze-ii/)

這個問題的做法和 [490\. The Maze](/interview/coding/490-the-maze) 的做法很類似，一樣是可以透過廣度優先搜索來做，並且搭配一個類似動態規劃的做法，那就是我們要去記錄出每一個座標，其從原點出發到該位置的「最短」距離。

一開始我們會先初始化一個記憶體位置，紀錄從起點出發到該位置的最短距離，每一個點的初始值都是無限大，並且出發點的值是 0 。

接著更新的目標是：如果目前該位置離原點出發的距離大於上一個出發位置離原點出發的距離加上到此位置的距離，那我們就會更新該位置的最短距離。

接著是如果我們已經遇到了終點，我們就不要再把終點放進去 queue 裡面，不然會有無限迴圈。

```python
class Solution:
    def shortestDistance(self, maze: List[List[int]], start: List[int], destination: List[int]) -> int:
        if not maze or not maze[0]: return False

        rows = len(maze)
        columns = len(maze[0])
        distance = [[float('inf')] * columns for _ in range(rows)]
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        distance[start[0]][start[1]] = 0
        quene = deque([start])

        while quene:
            row, col = quene.popleft()
            for dr, dc in directions:
                next_r = row
                next_c = col
                next_dist = 0
                while 0 <= next_r + dr < rows and 0 <= next_c + dc < columns and maze[next_r+dr][next_c+dc] != 1:
                    next_r += dr
                    next_c += dc
                    next_dist += 1
                if distance[row][col] + next_dist < distance[next_r][next_c]:
                    distance[next_r][next_c] = distance[row][col] + next_dist
                    if next_r == destination[0] and next_c == destination[1]:
                        continue
                    quene.append((next_r, next_c))

        shortest_distance = distance[destination[0]][destination[1]]
        return -1 if shortest_distance == float('inf') else shortest_distance;

```

## BFS

```python
class Solution:
    def shortestDistance(self, maze: List[List[int]], start: List[int], destination: List[int]) -> int:
        if not maze or not maze[0]: return False

        rows = len(maze)
        columns = len(maze[0])
        distance = [[float('inf')] * columns for _ in range(rows)]
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        distance[start[0]][start[1]] = 0
        q = deque([start])

        while q:
            r, c = q.popleft()
            for dr, dc in directions:
                next_r = r
                next_c = c
                next_dist = 0
                while 0 <= next_r + dr < rows and 0 <= next_c + dc < columns and maze[next_r+dr][next_c+dc] != 1:
                    next_r += dr
                    next_c += dc
                    next_dist += 1
                if distance[r][c] + next_dist < distance[next_r][next_c]:
                    distance[next_r][next_c] = distance[r][c] + next_dist
                    if next_r == destination[0] and next_c == destination[1]:
                        continue
                    q.append((next_r, next_c))

        shortest_distance = distance[destination[0]][destination[1]]
        return -1 if shortest_distance == float('inf') else shortest_distance;

```