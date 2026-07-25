---
slug: "74-search-a-2d-matrix"
section: "coding"
title: "74. Search a 2D Matrix"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1723608706
updated_at: 1723609017
published_at: 1723608706
---
[74\. Search a 2D Matrix](https://leetcode.com/problems/search-a-2d-matrix/)

```python
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        rows = len(matrix)
        cols = len(matrix[0])

        def getVal(idx):
            row = idx // cols
            col = idx % cols
            return matrix[row][col]
        left = 0
        right = rows * cols - 1

        while left <= right:
            mid = left + (right - left) // 2
            if getVal(mid) == target:
                return True
            elif getVal(mid) > target:
                right = mid - 1
            elif getVal(mid) < target:
                left = mid + 1
        
        return False
```