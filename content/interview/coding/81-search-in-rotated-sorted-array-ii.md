---
slug: "81-search-in-rotated-sorted-array-ii"
section: "coding"
title: "81. Search in Rotated Sorted Array II"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674943611
updated_at: 1674943650
published_at: 1674943611
---
[81\. Search in Rotated Sorted Array II](https://leetcode.com/problems/search-in-rotated-sorted-array-ii/)

```python
class Solution:
    def search(self, nums: List[int], target: int) -> bool:
        left = 0
        right = len(nums) - 1
        while left <= right:
            while left < right and nums[left] == nums[left + 1]:
                left += 1
            while left < right and nums[right] == nums[right - 1]:
                right -=1
            mid = left + (right - left) //2
            if nums[mid] == target:
                return True
            elif nums[mid] >= nums[left]:
                if nums[left] <= target < nums[mid]:
                    right = mid -1
                else: # nums[left] > target or nums[mid] <= target:
                    left = mid + 1
            else:
                if nums[mid] < target <= nums[right]:
                    left = mid + 1
                else: # target <= nums[mid] or target > nums[right]:
                    right = mid - 1
        return False
```