---
slug: "702-search-in-a-sorted-array-of-unknown-size"
section: "coding"
title: "702. Search in a Sorted Array of Unknown Size"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1712121076
updated_at: 1712121146
published_at: 1712121076
---
[702\. Search in a Sorted Array of Unknown Size](https://leetcode.com/problems/search-in-a-sorted-array-of-unknown-size/)

這個題目的主要考察點是要如何先確定邊界，剩下就是二分搜索。

```python
# """
# This is ArrayReader's API interface.
# You should not implement it, or speculate about its implementation
# """
#class ArrayReader:
#    def get(self, index: int) -> int:

class Solution:
    def search(self, reader: 'ArrayReader', target: int) -> int:
        
        if reader.get(0) == target:
            return 0
        
        left = 0
        right = 1
        
        while reader.get(right) < target:
            left = right
            right = right * 2
        
        while left <= right:
            mid = left + (right - left) // 2
            if reader.get(mid) == target:
                return mid
            if reader.get(mid) > target:
                right = mid - 1
            else:
                left = mid + 1
        
        return -1
```