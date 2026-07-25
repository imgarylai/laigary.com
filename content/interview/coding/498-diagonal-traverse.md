---
slug: "498-diagonal-traverse"
section: "coding"
title: "498. Diagonal Traverse"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1674843113
updated_at: 1674843144
published_at: 1674843113
---
[498\. Diagonal Traverse](https://leetcode.com/problems/diagonal-traverse/)

```python
class Solution:
    def findDiagonalOrder(self, mat: List[List[int]]) -> List[int]:

        if not mat or not mat[0]:
            return []

        R = len(mat)
        C = len(mat[0])

        res = []
        tmp = []
        for i in range(R + C - 1):
            tmp.clear()

            r = 0 if i < C else i - C + 1
            c = i if i < C else C - 1

            while r < R and c > -1:
                tmp.append(mat[r][c])
                r += 1
                c -= 1

            if i % 2 == 0:
                res.extend(tmp[::-1])
            else:
                res.extend(tmp)

        return res
```