---
slug: "78-subsets"
section: "coding"
title: "78. Subsets"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674844531
updated_at: 1723096340
published_at: 1674844531
---
[78\. Subsets](https://leetcode.com/problems/subsets/)

```python
class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:

        res = []
        n = len(nums)

        def backtrack(curr, start):
            res.append(list(curr))
            
            for i in range(start, n):
                curr.append(nums[i])
                backtrack(curr, i + 1)
                curr.pop()
        

        backtrack([], 0)
        
        return res
```