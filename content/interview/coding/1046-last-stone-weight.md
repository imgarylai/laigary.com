---
slug: "1046-last-stone-weight"
section: "coding"
title: "1046. Last Stone Weight"
status: "published"
pinned: false
tags: ["Design", "Heap"]
created_at: 1703747939
updated_at: 1703747977
published_at: 1703747939
---
[1046\. Last Stone Weight](https://leetcode.com/problems/last-stone-weight/)

```python
class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        heap = []
        for stone in stones:
            heapq.heappush(heap, -1 * stone)
        
        while len(heap) > 1:
            first = heapq.heappop(heap)
            second = heapq.heappop(heap)
            if first != second:
                heapq.heappush(heap, first - second)
        
        if len(heap) == 0:
            return 0
        else:
            return -1 * heap[0]
```