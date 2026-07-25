---
slug: "73-set-matrix-zeroes"
section: "coding"
title: "73. Set Matrix Zeroes"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1674842780
updated_at: 1674842836
published_at: 1674842780
---
[73\. Set Matrix Zeroes](https://leetcode.com/problems/set-matrix-zeroes/)

可以建立兩個陣列，一個用來儲存哪些列需要變零，一個用來儲存哪些行需要變零。

接下來分列跟行去替換成零。

```python
class Solution:
    def setZeroes(self, matrix: List[List[int]]) -> None:
        """
        Do not return anything, modify matrix in-place instead.
        """
        rows = len(matrix)
        cols = len(matrix[0])
        zero_rows = []
        zero_cols = []
        for row in range(rows):
            for col in range(cols):
                if matrix[row][col] == 0:
                    zero_rows.append(row)
                    zero_cols.append(col)

        for row in zero_rows:
            matrix[row] = [0] * cols

        for col in zero_cols:
            for row in range(rows):
                matrix[row][col]  = 0
```