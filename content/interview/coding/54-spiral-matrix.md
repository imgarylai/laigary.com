---
slug: "54-spiral-matrix"
section: "coding"
title: "54. Spiral Matrix"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1674842070
updated_at: 1674842138
published_at: 1674842070
---
[54\. Spiral Matrix](https://leetcode.com/problems/spiral-matrix/)

這一題的重點在於如果要在矩陣四個方向中行走要怎麼走，像是 [200\. Number of Islands](/interview/coding/200-number-of-islands) 也有用到。

```python
class Solution:
    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
        if not matrix or not matrix[0]:
            return []

        rows = len(matrix)
        cols = len(matrix[0])
        res = []
        # direction % 4 == ? is the direction
        direction = 0
        # dr[direction], dc[direction] is the delta 
        dr = [0, 1, 0, -1]
        dc = [1, 0, -1, 0]

        visited = set()

        # we start from (0, 0)
        row = 0
        col = 0
        for _ in range(rows * cols):
            visited.add((row,col))

            res.append(matrix[row][col])

            # Candidate:
            # next coordinate should be in boundry.
            # next coordinate should haven't been visited yet. 
            next_row = row + dr[direction]
            next_col = col + dc[direction]


            if 0 <= next_row < rows and 0 <= next_col < cols and (next_row, next_col) not in visited:
                row = next_row
                col = next_col
            else:
                direction = (direction + 1) % 4
                row = row + dr[direction]
                col = col + dc[direction]

        return res
```