---
slug: "1413-minimum-value-to-get-positive-step-by-step-sum"
section: "coding"
title: "1413. Minimum Value to Get Positive Step by Step Sum"
status: "published"
pinned: false
tags: ["Prefix Sum"]
created_at: 1742773012
updated_at: 1742773584
published_at: 1742773012
---
[1413\. Minimum Value to Get Positive Step by Step Sum](https://leetcode.com/problems/minimum-value-to-get-positive-step-by-step-sum/)

題目的問題是給定一個陣列，希望我們找到一個數字，從這個數字開始，一步一步的把每個元素加起來，並且檢視每一步的結果，我們希望得出每一步的結果都是正整數，這個數字可以有很多可能，我們想要求的是這個數字的最小值是多少？

這個有一點像是數學問題，思考的方向是我們其實要處理的地方在於在整個累加的過程中，出現的最小值是多少就好？例如如果最小值是 `-9` 代表的是我們至少要加 `10` 就可以確保所有的數字都是正的了。

```python
class Solution:
    def minStartValue(self, nums: List[int]) -> int:
        
        prefix = [nums[0]]
        
        for i in range(1, len(nums)):
            prefix.append(nums[i] + prefix[i - 1])
        
        target = min(prefix)
        
        if target >= 0:
            return 1
        else:
            return abs(target) + 1
```