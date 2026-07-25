---
slug: "119-pascals-triangle-ii"
section: "coding"
title: "119. Pascal's Triangle II"
status: "published"
pinned: false
tags: ["Array", "Recursion"]
created_at: 1698724802
updated_at: 1698800985
published_at: 1698724802
---
[119. Pascal's Triangle II](https://leetcode.com/problems/pascals-triangle-ii/)  

```python
class Solution:
    def getRow(self, rowIndex: int) -> List[int]:
        if rowIndex == 0:
            return [1]
        prev = self.getRow(rowIndex - 1)
        curr = []
        for i in range(len(prev) - 1):
            curr.append(prev[i] + prev[i+1])
        return [1] + curr + [1]
```