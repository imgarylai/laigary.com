---
slug: "259-3sum-smaller"
section: "coding"
title: "259. 3Sum Smaller"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973128
updated_at: 1674973128
published_at: 1674973128
---
[259\. 3Sum Smaller](https://leetcode.com/problems/3sum-smaller/)

```python
class Solution:        
    def threeSumSmaller(self, nums: List[int], target: int) -> int:
        count = 0
        nums.sort()
        for i in range(len(nums)):
            num = nums[i]
            left = i + 1
            right = len(nums) - 1
            while left < right:
                threeSum = num + nums[left] + nums[right]
                if threeSum < target:
                    count += right - left
                    left += 1
                else:
                    right -= 1

        return count

```