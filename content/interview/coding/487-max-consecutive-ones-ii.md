---
slug: "487-max-consecutive-ones-ii"
section: "coding"
title: "487. Max Consecutive Ones II"
status: "published"
pinned: false
tags: []
created_at: 1765083956
updated_at: 1765083997
published_at: 1765083956
---
[487\. Max Consecutive Ones II](https://leetcode.com/problems/max-consecutive-ones-ii/)

這一個題目應該直接使用 [1004\. Max Consecutive Ones III](/interview/coding/1004-max-consecutive-ones-iii) 來思考

```python
class Solution:
    def findMaxConsecutiveOnes(self, nums: List[int]) -> int:
        k = 1
        slow, fast, zeros, ans = 0, 0, 0, 0

        while fast < len(nums):
            # 當前數字為 0，增加 0 的計數
            if nums[fast] == 0:
                zeros += 1

            # 如果窗口中的 0 的數量超過了 k，縮小窗口
            if zeros > k:
                # 逐步縮小左側窗口，直到 0 的數量小於等於 k
                if nums[slow] == 0:
                    zeros -= 1
                slow += 1

            # 計算當前窗口的大小，並更新答案
            ans = max(ans, fast - slow + 1)
            fast += 1

        return ans
```