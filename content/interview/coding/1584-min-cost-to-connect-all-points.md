---
slug: "1584-min-cost-to-connect-all-points"
section: "coding"
title: "1584. Min Cost to Connect All Points"
status: "published"
pinned: false
tags: ["Graph", "UnionFind"]
created_at: 1709442682
updated_at: 1709442726
published_at: 1709442682
---
這一題如果不用 UnionFind 的確會有點難做。

```python
class UnionFind:
    def __init__(self, size):
        self.group = [0] * size
        self.rank = [0] * size
        
        for i in range(size):
            self.group[i] = i
      
    def find(self, x):
        if self.group[x] != x:
            self.group[x] = self.find(self.group[x])
        return self.group[x]

    def join(self, x, y):
        rootX = self.find(x)
        rootY = self.find(y)

        if self.rank[rootX] > self.rank[rootY]:
            self.group[rootY] = rootX
        elif self.rank[rootX] < self.rank[rootY]:
            self.group[rootX] = rootY
        else:
            self.group[rootX] = rootY
            self.rank[rootY] += 1

    def connected(self, x: int, y: int) -> bool:
        return self.find(x) == self.find(y)


class Solution:
    def minCostConnectPoints(self, points: List[List[int]]) -> int:
        
        if not points:
            return -1
        
        def distance(p1, p2):
            return abs(p1[0] - p2[0]) + abs(p1[1] - p2[1])
        
        heap = []
        for i in range(len(points)):
            p1 = points[i]
            for j in range(i + 1, len(points)):
                p2 = points[j]
                d = distance(p1, p2)
                heapq.heappush(heap, (d, i, j))
        
        uf = UnionFind(len(points))
        total = 0
        n = 0

        while heap:
            d, p1, p2 = heapq.heappop(heap)
            if not uf.connected(p1, p2):
                uf.join(p1, p2)
                total += d
                n += 1
                if n == len(points) - 1:
                    break
        
        return total

```