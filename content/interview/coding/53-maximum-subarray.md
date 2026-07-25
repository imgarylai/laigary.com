---
slug: "53-maximum-subarray"
section: "coding"
title: "53. Maximum Subarray"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674949205
updated_at: 1674949262
published_at: 1674949205
---
[53\. Maximum Subarray](https://leetcode.com/problems/maximum-subarray/)

## 暴力解

```python
class Solution:
    def maxSubArray(self, nums: List[int]) -> int:

        ans = 0
        for end in range(1, len(nums)+1):
            for start in range(end):
                local = 0
                for i in range(start, end):
                    local += nums[i]
                ans = max(ans, local)
        return ans
```

## 自底向上

這題的想法是，我不斷的計算出當前位置前一直到現在的所有元素的總和，如果說總和比當下的值小，那代表當前位置的子陣列總和應該就要用當下的值，如果說總和比當下的值大，那就代表可以有更大的最大子陣列。

最後找出 `dp` 中的最大值就好。

```python
class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        dp = [float('-inf')] * len(nums)

        dp[0] = nums[0]
        for i in range(1, len(nums)):
            dp[i] = max(nums[i], nums[i] + dp[i - 1])

        return max(dp)
```