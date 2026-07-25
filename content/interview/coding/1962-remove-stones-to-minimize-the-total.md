---
slug: "1962-remove-stones-to-minimize-the-total"
section: "coding"
title: "1962. Remove Stones to Minimize the Total"
status: "published"
pinned: false
tags: ["Heap"]
created_at: 1743301663
updated_at: 1743301692
published_at: 1743301663
---
[1962\. Remove Stones to Minimize the Total](https://leetcode.com/problems/remove-stones-to-minimize-the-total/)

```python
class Solution:
    def minStoneSum(self, piles: List[int], k: int) -> int:
        heap = []
        for pile in piles:
            heapq.heappush(heap, -pile)
        
        while k > 0:
            top = heapq.heappop(heap)
            heapq.heappush(heap, floor(top / 2))
            k -= 1
        
        return sum([-pile for pile in heap])
```