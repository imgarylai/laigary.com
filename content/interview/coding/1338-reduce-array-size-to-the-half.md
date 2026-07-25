---
slug: "1338-reduce-array-size-to-the-half"
section: "coding"
title: "1338. Reduce Array Size to The Half"
status: "published"
pinned: false
tags: ["Greedy", "Hash Table", "Heap"]
created_at: 1761795872
updated_at: 1761795908
published_at: 1761795872
---
[1338\. Reduce Array Size to The Half](https://leetcode.com/problems/reduce-array-size-to-the-half/)

```python
class Solution:
    def minSetSize(self, arr: List[int]) -> int:
        counter = Counter(arr)
        heap = []

        for k, v in counter.items():
            heapq.heappush(heap, (-v, k))

        acc = 0
        count = 0
        total = len(arr)

        while acc < total // 2 and heap:
            v, k = heapq.heappop(heap)
            acc -= v
            count += 1
        
        return count
```