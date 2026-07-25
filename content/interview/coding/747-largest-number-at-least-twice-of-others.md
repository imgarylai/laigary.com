---
slug: "747-largest-number-at-least-twice-of-others"
section: "coding"
title: "747. Largest Number At Least Twice of Others"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1684732693
updated_at: 1710027038
published_at: 1684732693
---
[747.Largest Number At Least Twice of Others](https://leetcode.com/problems/largest-number-at-least-twice-of-others/)

這一題是一個簡單的題目，解題的主要邏輯：

1.  遍歷整個陣列一次並找出最大值，同時紀錄位置在哪。
2.  再次遍歷整個陣列，並確保所有的數字的兩倍數值，都不會大於自己，並且根據題目所描述，由於最大值題目有說只會有一個，所以遍歷時可以利用當前的指針和紀錄的位置，或是當前的值與最大值相比，當條件符合時，可以略過檢查。
3.  當前值兩倍大於最大值的時候，可以直接回傳 -1

```python
class Solution:
    def dominantIndex(self, nums: List[int]) -> int:

        m = float('-inf')
        idx = -1

        for i in range(len(nums)):
            if nums[i] >= m:
                m = nums[i]
                idx = i
        
        for num in nums:
            if num == m:
                continue
            if m < num * 2:
                return -1
        
        return idx
```

這題可以挑戰的解法為，是否可以在一個 for 迴圈結束時，及收集算所有的資訊。

```python
class Solution:
    def dominantIndex(self, nums: List[int]) -> int:
        
        if not nums:
            return -1

        m = float('-inf')
        idx = -1
        rest = float('-inf')

        for i in range(len(nums)):
            if nums[i] >= m:
                rest = max(rest, m * 2)
                m = nums[i]
                idx = i
            else:
                rest = max(rest, nums[i] * 2)

        if m >= rest:
            return idx
        else:
            return -1
```