---
slug: "47-permutations-ii"
section: "coding"
title: "47. Permutations II"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674844803
updated_at: 1723097577
published_at: 1674844803
---
[47\. Permutations II](https://leetcode.com/problems/permutations-ii/)

有重複的數字出現，要去記錄使用的次數

```python
class Solution:
    def permuteUnique(self, nums: List[int]) -> List[List[int]]:
        res = []
        def backtrack(curr, counter):
            if len(curr) == len(nums):
                res.append(list(curr))
                return
            for num in counter:
                if counter[num] > 0:
                    counter[num] -= 1
                    curr.append(num)
                    backtrack(curr, counter)
                    counter[num] += 1
                    curr.pop()
        backtrack([], Counter(nums))
        return res
```
```python
class Solution:
    def permuteUnique(self, nums: List[int]) -> List[List[int]]:
        res = []
        nums.sort()

        def backtrack(curr, visited):
            if len(curr) == len(nums):
                res.append(curr.copy())
                return
            
            for i in range(len(nums)):
                if i in visited:
                    continue
                if i > 0 and nums[i] == nums[i - 1] and (i - 1) not in visited:
                    continue
                num = nums[i]
                curr.append(num)
                visited.add(i)
                backtrack(curr, visited)
                visited.remove(i)
                curr.pop()
            
        backtrack([], set())

        return res

```