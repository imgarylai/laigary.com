---
slug: "4-median-of-two-sorted-arrays"
section: "coding"
title: "4. Median of Two Sorted Arrays"
status: "published"
pinned: false
tags: ["Binary Search", "Classic"]
created_at: 1674973114
updated_at: 1717912292
published_at: 1674973114
---
[4\. Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/)

這個題目直覺的解法很簡單，做法也很多種，因為題目的邏輯很簡單，就是要找到中位數。

其中題目有給出一個特殊的條件，那就是題目的兩個陣列是排序好的陣列，已經是排序好的陣列就給了我們一個優勢，那就是如果要找出中位數，通常的做法也是先把陣列排序好，再來找出中位數。於是這個題目就很像是另一個題目的變形：

-   [88\. Merge Sorted Array](/interview/coding/88-merge-sorted-array)
-   [23\. Merge k Sorted Lists](/interview/coding/23-merge-k-sorted-lists)
-   [21\. Merge Two Sorted Lists](/interview/coding/21-merge-two-sorted-lists)

因為題目給定的序列已經是排序好的，這樣只要依序從各個序列中取出最小的值後，再合併起來，就可以得到「一個」完整的序列，之後就可以找到中位數，其中在稍微處理邊界情況，那就是序列的長度是奇數還是偶數。其中的時間複雜度是 $O(m+n)$

這個題目還存在著一個時間複雜度為 $O(log(m+n)$更優的解法。

```python
class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        min_heap = []
        max_heap = []

        def balance_heap(num):
            if len(min_heap) >= len(max_heap):
                top = heapq.heappushpop(min_heap, num)
                heapq.heappush(max_heap, -top)
            elif len(min_heap) < len(max_heap):
                top = heapq.heappushpop(max_heap, -num)
                heapq.heappush(min_heap, -top)     

        for num in nums1:
            balance_heap(num)

        for num in nums2:
            balance_heap(num)

        if len(min_heap) > len(max_heap):
            return heapq.heappop(min_heap)
        elif len(min_heap) < len(max_heap):
            return -heapq.heappop(max_heap)
        else:
            return (heapq.heappop(min_heap) - heapq.heappop(max_heap)) / 2

```

Reference:

[https://laigary.com/295-find-median-from-data-stream/](/interview/coding/295-find-median-from-data-stream)