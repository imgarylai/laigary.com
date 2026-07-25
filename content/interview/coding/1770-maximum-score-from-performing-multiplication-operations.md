---
slug: "1770-maximum-score-from-performing-multiplication-operations"
section: "coding"
title: "1770. Maximum Score from Performing Multiplication Operations"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1704434659
updated_at: 1709446474
published_at: 1704434659
---
[1770\. Maximum Score from Performing Multiplication Operations](https://leetcode.com/problems/maximum-score-from-performing-multiplication-operations/)

Top-Down

```python
class Solution:
    def maximumScore(self, nums: List[int], multipliers: List[int]) -> int:

        @lru_cache
        def helper(leftBound, rightBound, i):
            if i == len(multipliers):
                return 0
            multiplier = multipliers[i]

            return max(
                multiplier * nums[leftBound] + helper(leftBound + 1, rightBound, i + 1),
                multiplier * nums[rightBound] + helper(leftBound, rightBound - 1, i + 1))

        return helper(0, len(nums) - 1, 0)
```
```python
class Solution:
    def maximumScore(self, nums: List[int], multipliers: List[int]) -> int:
        
        m = len(multipliers)
        memo = {}

        def helper(left, i):
            if i == m:
                return 0

            if (left, i) in memo:
                return memo[(left, i)]

            multiplier = multipliers[i]
            right = len(nums) - 1 - (i - left)

            l = nums[left] * multiplier + helper(left + 1, i + 1)
            r = nums[right] * multiplier + helper(left, i + 1)
            memo[(left, i)] = max(l, r)
            return memo[(left, i)]

        return helper(0, 0)
```