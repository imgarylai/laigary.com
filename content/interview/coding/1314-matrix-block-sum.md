---
slug: "1314-matrix-block-sum"
section: "coding"
title: "1314. Matrix Block Sum"
status: "published"
pinned: false
tags: ["Prefix Sum"]
created_at: 1724002492
updated_at: 1724002549
published_at: 1724002492
---
[1314\. Matrix Block Sum](https://leetcode.com/problems/matrix-block-sum/)

參考 [304\. Range Sum Query 2D - Immutable](/interview/coding/304-range-sum-query-2d-immutable)

並且注意矩陣的上下界

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
        

class Solution:
    def matrixBlockSum(self, mat: List[List[int]], k: int) -> List[List[int]]:
        rows, cols = len(mat), len(mat[0])
        numMatrix = NumMatrix(mat)
        res = [[0] *cols for _ in range(rows)]
        for row in range(rows):
            for col in range(cols):
                r1 = max(row - k, 0)
                c1 = max(col - k, 0)

                r2 = min(row + k, rows - 1)
                c2 = min(col + k, cols - 1)

                res[row][col] = numMatrix.sumRegion(r1, c1, r2, c2)
        return res
```