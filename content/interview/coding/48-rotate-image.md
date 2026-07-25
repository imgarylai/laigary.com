---
slug: "48-rotate-image"
section: "coding"
title: "48. Rotate Image"
status: "published"
pinned: false
tags: ["Other"]
created_at: 1674972900
updated_at: 1674972900
published_at: 1674972900
---
[48\. Rotate Image](https://leetcode.com/problems/rotate-image/)

這一題沒有什麼太特別的演算法…考的就是對於矩陣的位置是不是能夠快速的判定

```python
class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        """
        Do not return anything, modify matrix in-place instead.
        """
        n = len(matrix)

        for row in range(n//2 + n %2):
            for col in range(n//2):
                tmp = matrix[n-1-col][row]
                matrix[n-1-col][row] = matrix[n-1-row][n-1-col]
                matrix[n-1-row][n-1-col] = matrix[col][n-1-row]
                matrix[col][n-1-row] = matrix[row][col]
                matrix[row][col] = tmp

```