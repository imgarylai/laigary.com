---
slug: "692-top-k-frequent-words"
section: "coding"
title: "692. Top K Frequent Words"
status: "published"
pinned: false
tags: ["Heap"]
created_at: 1674972901
updated_at: 1743398241
published_at: 1674972901
---
[692\. Top K Frequent Words](https://leetcode.com/problems/top-k-frequent-words/)

直接透過 Heap 的特性來完成。

```python
class Solution:
    def topKFrequent(self, words: List[str], k: int) -> List[str]:
        counter = Counter(words)
        q = []
        heapq.heapify(q)
        for key, value in counter.items():
            heapq.heappush(q, (-value, key))
        res = heapq.nsmallest(k, q)
        return [value for key, value in res]

```