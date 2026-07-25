---
slug: "118-pascals-triangle"
section: "coding"
title: "118. Pascal's Triangle"
status: "published"
pinned: false
tags: ["Array", "Recursion"]
created_at: 1698724692
updated_at: 1698724785
published_at: 1698724692
---
[118. Pascal's Triangle](https://leetcode.com/problems/pascals-triangle/)  

```python
class Solution:
    def generate(self, numRows: int) -> List[List[int]]:
        def helper(numRows):
            if numRows == 1:
                res.append([1])
                return [1]
            prev = helper(numRows - 1)
            curr = []
            for i in range(len(prev) - 1):
                curr.append(prev[i] + prev[i+1])
            res.append([1] + curr + [1])
            return [1] + curr + [1]

        res = []
        helper(numRows)
        return res
```