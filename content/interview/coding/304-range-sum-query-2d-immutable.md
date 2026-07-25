---
slug: "304-range-sum-query-2d-immutable"
section: "coding"
title: "304. Range Sum Query 2D - Immutable"
status: "published"
pinned: false
tags: ["Classic", "Prefix Sum"]
created_at: 1724001490
updated_at: 1724002364
published_at: 1724001490
---
[304\. Range Sum Query 2D - Immutable](https://leetcode.com/problems/range-sum-query-2d-immutable/)

解題方式同： [303\. Range Sum Query - Immutable](/interview/coding/303-range-sum-query-immutable)

```python
class NumMatrix:

    def __init__(self, matrix: List[List[int]]):
        rows = len(matrix)
        cols = len(matrix[0])
        if rows == 0 or cols == 0:
            return
        self.preSum = [[0 for _ in range(cols + 1)] for _ in range(rows + 1)]
        for i in range(1, rows + 1):
            for j in range(1, cols + 1):
                self.preSum[i][j] = self.preSum[i-1][j] + self.preSum[i][j-1] + matrix[i-1][j-1] - self.preSum[i-1][j-1]


    def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:
        return self.preSum[row2+1][col2+1] - self.preSum[row1][col2+1] - self.preSum[row2+1][col1] + self.preSum[row1][col1]
```