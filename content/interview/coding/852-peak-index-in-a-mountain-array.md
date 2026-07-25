---
slug: "852-peak-index-in-a-mountain-array"
section: "coding"
title: "852. Peak Index in a Mountain Array"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674944098
updated_at: 1746396497
published_at: 1674944098
---
[852\. Peak Index in a Mountain Array](https://leetcode.com/problems/peak-index-in-a-mountain-array/)

這個題目是 [162\. Find Peak Element](/interview/coding/162-find-peak-element) 的精簡版。

1.  在閉區間搜尋
2.  從中間開始找
    1.  如果下一個數字比現在的大，向右逼近
    2.  如果下一個數字比現在小或是一樣，向左逼近

```python
class Solution:
    def peakIndexInMountainArray(self, arr: List[int]) -> int:
        left = 0
        right = len(arr) - 1

        while left < right:
            mid = left + (right - left) // 2
            # Peak is on right hand side
            if arr[mid] < arr[mid + 1]:
                left = mid + 1
            # Peak is on left hand side. Or mid is the peak
            else: # arr[mid] >= arr[mid + 1]
                right = mid
        
        return left
```