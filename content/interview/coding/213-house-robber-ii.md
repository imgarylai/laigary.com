---
slug: "213-house-robber-ii"
section: "coding"
title: "213. House Robber II"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674948841
updated_at: 1704259583
published_at: 1674948841
---
[213\. House Robber II](https://leetcode.com/problems/house-robber-ii/)

基本上先完成 [198\. House Robber](/interview/coding/198-house-robber) 自頂向下或自底向上都沒關係，接著判斷要不要偷第一家或最後一家，取比較大的值。

```python
class Solution:

    def rob_one(self, nums: List[int]) -> int:
        p1 = nums[0]
        p2 = max(p1, nums[1])
        res = max(p1, p2)
        for i in range(2, len(nums)):
            res = max(p2, nums[i] + p1)
            p1 = p2
            p2 = res
        return res

    def rob(self, nums: List[int]) -> int:
        if not nums:
            return 0
        if len(nums) <= 2:
            return max(nums)

        t1 = self.rob_one(nums[:-1])
        t2 = self.rob_one(nums[1:])
        return max(t1, t2)
```