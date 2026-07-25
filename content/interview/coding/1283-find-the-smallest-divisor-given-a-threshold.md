---
slug: "1283-find-the-smallest-divisor-given-a-threshold"
section: "coding"
title: "1283. Find the Smallest Divisor Given a Threshold"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1761861941
updated_at: 1761863602
published_at: 1761861941
---
[1283\. Find the Smallest Divisor Given a Threshold](https://leetcode.com/problems/find-the-smallest-divisor-given-a-threshold/)

這題只要先做過 [875\. Koko Eating Bananas](/interview/coding/875-koko-eating-bananas) 就會了。

```python
class Solution:
    def smallestDivisor(self, nums: List[int], threshold: int) -> int:
        
        def findDivisor(divisor):
            res = 0
            for num in nums:
                res += num//divisor
                if num % divisor != 0:
                    res += 1
            return res
        
        left = 1
        right = max(nums)
        
        while left <= right:
            mid = left + (right - left)//2
            divisor = findDivisor(mid)
            if divisor <= threshold: # divisor is too large
                right = mid - 1
            else:
                left = mid + 1
        
        
        return left
```