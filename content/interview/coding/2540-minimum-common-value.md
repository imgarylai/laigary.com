---
slug: "2540-minimum-common-value"
section: "coding"
title: "2540. Minimum Common Value"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1761891276
updated_at: 1761891292
published_at: 1761891276
---
[2540\. Minimum Common Value](https://leetcode.com/problems/minimum-common-value/)

```python
class Solution:
    def getCommon(self, nums1: List[int], nums2: List[int]) -> int:
        
        i1 = 0
        i2 = 0

        while i1 < len(nums1) and i2 < len(nums2):
            if nums1[i1] == nums2[i2]:
                return nums1[i1]
            
            if nums1[i1] > nums2[i2]:
                i2 += 1
            else:
                i1 += 1
        
        return -1
```