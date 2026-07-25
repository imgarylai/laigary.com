---
slug: "198-house-robber"
section: "coding"
title: "198. House Robber"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674948787
updated_at: 1704260017
published_at: 1674948787
---
[198\. House Robber](https://leetcode.com/problems/house-robber/)

## 自頂向下

```python
class Solution:
    def rob(self, nums: List[int]) -> int:  
        memo = {}

        def dp(index):
            if index >= len(nums):
                return 0
            if index in memo:
                return memo[index]
            memo[index] = max(dp(index + 1), dp(index + 2) + nums[index])
            return memo[index]

        return dp(0)
```

## 自底向上

```python
class Solution:
    def rob(self, nums: List[int]) -> int:  
        memo = [0] * (len(nums) + 1)
        memo[0] = 0
        memo[1] = nums[0]

        for i in range(2, len(memo)):
            num = nums[i-1]
            memo[i] = max(memo[i-1], memo[i-2] + num)

        return memo[-1]
```