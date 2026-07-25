---
slug: "417-pacific-atlantic-water-flow"
section: "coding"
title: "417. Pacific Atlantic Water Flow"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1674972897
updated_at: 1709523132
published_at: 1674972897
---
[417\. Pacific Atlantic Water Flow](https://leetcode.com/problems/pacific-atlantic-water-flow/)

## 廣度優先搜索

BFS 也可以利用一次把多個點加入 queue 後再開始出發，先加入到 queue 的都會先出發，所以不影響慢慢探索的情況。

```python
class Solution:
    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:
        if not heights or not heights[0]:
            return []

        rows = len(heights)
        columns = len(heights[0])

        pacific_queue = []
        atlantic_queue = []

        for row in range(rows):
            pacific_queue.append((row, 0))
            atlantic_queue.append((row, columns - 1))

        for column in range(columns):
            pacific_queue.append((0, column))
            atlantic_queue.append((rows - 1, column))


        def bfs(queue):
            reachable = set()
            while queue:
                x, y = queue.pop(0)
                reachable.add((x, y))
                for step_x, step_y in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
                    next_x, next_y = x + step_x, y + step_y
                    if next_x < 0 or next_x >= rows or next_y < 0 or next_y >= columns:
                        # out of boundary
                        continue
                    if (next_x, next_y) in reachable:
                        # has visited
                        continue
                    if heights[x][y] > heights[next_x][next_y]:
                        # water can't flow from the new coordinate
                        continue
                    queue.append((next_x, next_y))

            return reachable

        pacific_reachable = bfs(pacific_queue)
        atlantic_reachable = bfs(atlantic_queue)

        return pacific_reachable.intersection(atlantic_reachable)

```