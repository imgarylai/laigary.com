---
slug: "870-advantage-shuffle"
section: "coding"
title: "870. Advantage Shuffle"
status: "published"
pinned: false
tags: ["Heap", "Two Pointers"]
created_at: 1723609812
updated_at: 1723609854
published_at: 1723609812
---
[870\. Advantage Shuffle](https://leetcode.com/problems/advantage-shuffle/)

```python
class Solution:
    def advantageCount(self, nums1: List[int], nums2: List[int]) -> List[int]:
        
        n = len(nums1)
        nums1.sort()
        heap = []

        for i in range(len(nums2)):
            num = nums2[i]
            # Pytho 的 heap 是最小的在最上面，但是我們要的是最大的要在最上面。
            heapq.heappush(heap, (-num, i))

        left = 0
        right = n - 1
        res = [0] * n

        while heap:
            val, idx = heapq.heappop(heap)
            val = val * -1
            if val < nums1[right]:
                res[idx] = nums1[right]
                right -= 1
            else:
                res[idx] = nums1[left]
                left += 1
        return res
```