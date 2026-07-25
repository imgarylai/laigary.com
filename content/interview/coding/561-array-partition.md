---
slug: "561-array-partition"
section: "coding"
title: "561. Array Partition"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1686111838
updated_at: 1686111884
published_at: 1686111838
---
[561\. Array Partition](https://leetcode.com/problems/array-partition/description/)

```python
class Solution:
    def arrayPairSum(self, nums: List[int]) -> int:
        nums.sort()
        
        res = 0
        i = 0
        
        while i < len(nums):
            res += nums[i]
            i += 2
            
        return res
```