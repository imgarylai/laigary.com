---
slug: "2342-max-sum-of-a-pair-with-equal-sum-of-digits"
section: "coding"
title: "2342. Max Sum of a Pair With Equal Sum of Digits"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1743824346
updated_at: 1743824941
published_at: 1743824346
---
[2342\. Max Sum of a Pair With Equal Sum of Digits](https://leetcode.com/problems/max-sum-of-a-pair-with-equal-sum-of-digits/)

這一個題目和 [2260\. Minimum Consecutive Cards to Pick Up](/interview/coding/2260-minimum-consecutive-cards-to-pick-up) 有點像，但是有一個比較特別的地方，那就是這個題目的 key 是 digit sum ，像是 18 和 81 會有相同的的 digit sum ，如果 18 出現的比較後面，我們還是要使用 81 的 index 才可以有最大值。

```python
class Solution:
    def maximumSum(self, nums: List[int]) -> int:
        def getSumDigit(num: int):
            res = 0
            while num != 0:
                res += num % 10
                num = num // 10
            return res

        table = {}

        res = float('-inf')
        for i in range(len(nums)):
            num = nums[i]
            sumDigit = getSumDigit(num)
            if sumDigit in table:
                res = max(res, num + nums[table[sumDigit]])
                if num >= nums[table[sumDigit]]:
                    table[sumDigit] = i
            else:
                table[sumDigit] = i
        
        return -1 if res == float('-inf') else res

```