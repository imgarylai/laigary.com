---
slug: "216-combination-sum-iii"
section: "coding"
title: "216. Combination Sum III"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674844441
updated_at: 1761889332
published_at: 1674844441
---
[216\. Combination Sum III](https://leetcode.com/problems/combination-sum-iii/)

這一題和 [77\. Combinations](/interview/coding/77-combinations) 與 [39\. Combination Sum](/interview/coding/39-combination-sum) 差不多，其實比 [40\. Combination II](/interview/coding/40-combination-sum-ii) 簡單。

```python
class Solution:
    def combinationSum3(self, k: int, n: int) -> List[List[int]]:
        ans = []
        def backtrack(curr, target, start):
            if target == 0 and if len(curr) == k:
                ans.append(list(curr))
                return
            if target < 0:
                return
            else:
                for i in range(start, 10):
                    curr.append(i)
                    backtrack(curr, target - i, i + 1)
                    curr.pop()
        backtrack([], n, 1)
        return ans
```
```python
class Solution:
    def combinationSum3(self, k: int, n: int) -> List[List[int]]:
        
        res = []
        
        def backtrack(curr, total, start):
            if len(curr) == k:
                if total == n:
                    res.append(curr.copy())
                return
            if total > n:
                return
            
            for i in range(start, 10):
                curr.append(i)
                total += i
                backtrack(curr, total, i + 1)
                curr.pop()
                total -= i
        
        backtrack([], 0, 1)
    
        return res
```