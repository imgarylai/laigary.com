---
slug: "1992-find-all-groups-of-farmland"
section: "coding"
title: "1992. Find All Groups of Farmland"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1746320848
updated_at: 1746320877
published_at: 1746320848
---
[1992\. Find All Groups of Farmland](https://leetcode.com/problems/find-all-groups-of-farmland/)

```python
class Solution:
    def findFarmland(self, land: List[List[int]]) -> List[List[int]]:
        res = []

        m = len(land)
        n = len(land[0])

        def helper(i, j):
            k = i
            w = j
            while k < m and land[k][j] == 1:
                k += 1
            while w < n and land[i][w] == 1:
                w += 1
            for x in range(i, k):
                for y in range(j, w):
                    land[x][y] = 0
            
            return [i, j, k - 1, w - 1]

        res = []
        for i in range(m):
            for j in range(n):
                if land[i][j] == 1:
                    res.append(helper(i, j))
        
        return res


```