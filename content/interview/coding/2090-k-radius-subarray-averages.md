---
slug: "2090-k-radius-subarray-averages"
section: "coding"
title: "2090. K Radius Subarray Averages"
status: "published"
pinned: false
tags: ["Prefix Sum"]
created_at: 1742774535
updated_at: 1761106738
published_at: 1742774535
---
[2090\. K Radius Subarray Averages](https://leetcode.com/problems/k-radius-subarray-averages/)

這個題目的重點是細心處理邊界問題。

```python
class Solution:
    def getAverages(self, nums: List[int], k: int) -> List[int]:
        
        
        prefix = [nums[0]]
        for i in range(1, len(nums)):
            prefix.append(prefix[i - 1] + nums[i])
        
        res = []
        
        n = len(prefix)
        for i in range(n):
            if i - k >= 0 and i + k < n:
                tmp = (prefix[i + k] - prefix[i - k] + nums[i - k]) // (2 * k + 1)
                res.append(tmp)
            else:
                res.append(-1)
        
        return res

```
```python
class Solution:
    def getAverages(self, nums: List[int], k: int) -> List[int]:
        
        prefix = [nums[0]]
        n = len(nums)
        for i in range(1, n):
            prefix.append(prefix[i-1] + nums[i])
        
        res = [-1] * n

        for i in range(k, n - k):
            res[i] = (prefix[i + k] - prefix[i - k] + nums[i-k])//(2*k+1)
        
        return res
```