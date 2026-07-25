---
slug: "46-permutations"
section: "coding"
title: "46. Permutations"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674844770
updated_at: 1723096437
published_at: 1674844770
---
[46\. Permutations](https://leetcode.com/problems/permutations/)

```python
class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        
        res = []

        def helper(curr, visited):
            if len(curr) == len(nums):
                res.append(list(curr))
                return
            
            for i in range(len(nums)):
                if i in visited:
                    continue
                num = nums[i]
                curr.append(num)
                visited.add(i)
                helper(curr, visited)
                visited.remove(i)
                curr.pop()
        
        helper([], set())

        return res
```