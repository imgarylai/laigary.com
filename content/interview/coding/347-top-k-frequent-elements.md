---
slug: "347-top-k-frequent-elements"
section: "coding"
title: "347. Top K Frequent Elements"
status: "published"
pinned: false
tags: ["Heap"]
created_at: 1674972899
updated_at: 1703656801
published_at: 1674972899
---
[347\. Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)

將頻率透過

```python
class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:

        counter = Counter(nums)

        pq = []

        heapq.heapify(pq)

        for key in counter.keys():
            heapq.heappush(pq, (-counter[key], key))

        res = []

        while k > 0:
            value, key = heapq.heappop(pq)
            res.append(key)
            k -= 1

        return res

```
```python
class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:        
        counter = Counter(nums)
        
        vals = list(counter.values())
        
        heap = []
        for val in vals:
            heapq.heappush(heap, val)
            if len(heap) > k:
                heapq.heappop(heap)
    
        kFreq = heap[0]
    
        res = []
        for key, val in counter.items():
            if val >= kFreq:
                res.append(key)
        
        return res
```