---
slug: "240-search-a-2d-matrix-ii"
section: "coding"
title: "240. Search a 2D Matrix II"
status: "published"
pinned: false
tags: []
created_at: 1723609027
updated_at: 1723609100
published_at: 1723609027
---
[240\. Search a 2D Matrix II](https://leetcode.com/problems/search-a-2d-matrix-ii/)

```python
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        rows = len(matrix)
        cols = len(matrix[0])
    
        i = 0
        j = cols - 1
        while i < rows and j >= 0:
            if matrix[i][j] == target:
                return True
            if matrix[i][j] < target:
                i += 1
            else:
                j -= 1
        return False

```

類似題目 [74\. Search a 2D Matrix](/interview/coding/74-search-a-2d-matrix)