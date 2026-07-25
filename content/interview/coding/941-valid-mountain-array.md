---
slug: "941-valid-mountain-array"
section: "coding"
title: "941. Valid Mountain Array"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1674841913
updated_at: 1674841943
published_at: 1674841913
---
[941\. Valid Mountain Array](https://leetcode.com/problems/valid-mountain-array/)

```python
class Solution:
    def validMountainArray(self, arr: List[int]) -> bool:
        peak = 0
        n = len(arr)

        # Climb to the peak 
        for i in range(1, n):
            if arr[i] > arr[i - 1]:
                peak = i
            else:
                break

        # Climb to the peak 
        # - peak == 0: the starting point is the peak
        # - peak == n - 1: the ending point is the peak
        if peak == 0 or peak == n - 1:
            return False

        # Keep climbing to the end
        for i in range(peak, n - 1):
            # if next point is larger then current point, it goes up again. 
            if arr[i] <= arr[i + 1]:
                return False

        return True
```