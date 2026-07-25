---
slug: "973-k-closest-points-to-origin"
section: "coding"
title: "973. K Closest Points to Origin"
status: "published"
pinned: false
tags: ["Heap"]
created_at: 1674972900
updated_at: 1703880294
published_at: 1674972900
---
[973\. K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/)

這一個題目要找的是 k 個最靠近原點的點，所以有兩個步驟要處理。

第一個是要先寫出如何計算出距離的公式。

第二個是可以利用 heap 的特色，保持 k 個最小值的特色，只是這裡要 pop 掉的是最大值，所以存進去時，要用 max heap 的方式來做。

時間複雜度： $O(nlogk)$

```python
class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        heap = []
        heapq.heapify(heap)

        def getDist(x, y):
            return (x**2 + y**2)**0.5

        for x, y in points:
            dest = getDist(x, y)
            if len(heap) == k:
                heapq.heappush(heap, (-dest, [x, y]))
                heapq.heappop(heap)
            else:
                heapq.heappush(heap, (-dest, [x, y]))

        return [value for key, value in heap]

```

Python 的 heap API 可以簡化 L12L13

```python
class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        heap = []
        heapq.heapify(heap)

        def getDest(x, y):
            return (x**2 + y**2)**0.5

        for x, y in points:
            dest = getDest(x, y)
            if len(heap) == k:
                heapq.heappushpop(heap, (-dest, [x, y]))
            else:
                heapq.heappush(heap, (-dest, [x, y]))

        return [value for key, value in heap]

```
```python
class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        
        def dist(point):
            return point[0] ** 2 + point[1] ** 2
        
        heap = []
        for point in points:
            heapq.heappush(heap, (-1 * dist(point), point))
            if len(heap) > k:
                heapq.heappop(heap)
        
        return [item[1] for item in heap]
```