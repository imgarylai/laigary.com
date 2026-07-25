---
slug: "kth-smallest-element-in-a-sorted-matrix"
section: "coding"
title: "Kth Smallest Element in a Sorted Matrix"
status: "published"
pinned: false
tags: ["Heap"]
created_at: 1703889646
updated_at: 1703891967
published_at: 1703889646
---
[378\. Kth Smallest Element in a Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/)

題目的要求是找到在一個排序好的組合矩陣中，找到第 k 個最小的元素。

最簡單的方式當然就是全部排列出來後，再直接找到該元素，但是這樣的記憶體需求是 $O(n^2)$，題目希望我們可以用更少的記憶體來完成。

```python
class Solution:
    def kthSmallest(self, matrix: List[List[int]], k: int) -> int:
        
        heap = []
        
        for i in range(len(matrix)):
            for j in range(len(matrix)):
                heapq.heappush(heap, -1 * matrix[i][j])
                if len(heap) > k:
                    heapq.heappop(heap)
        
        return heap[0] * -1
```