---
slug: "90-subsets-ii"
section: "coding"
title: "90. Subsets II"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674844586
updated_at: 1723099569
published_at: 1674844586
---
[90\. Subsets II](https://leetcode.com/problems/subsets-ii/)

這個題目是 [78\. Subsets](/interview/coding/78-subsets) 的延伸，只是給定的陣列裡面會有重複的數值，會導致找到的子集合可能是重複的，這些都是我們要去除掉的，只是要如何避免重複的情況？

在做 backtrack 時，我們會有一個用來儲存的變數，慢慢地想要的元素加進去這個變數裡面，所以我們要確保的是當下要加入的變數，之前沒有出現過。

對於一個陣列要判斷之前是否出現過，最好的方法其實就是一個排序過的陣列，我們只要去操作查看前一個位置的變數跟現在這個位置的變數的值是否相同，這樣就可以了。

因此在程式執行的初期，就先要去針對陣列去做排序(L5)。

```python
class Solution:
    def subsetsWithDup(self, nums: List[int]) -> List[List[int]]:
        n = len(nums)
        ans = []
        nums.sort()
        def backtrack(k, curr, start):
            if len(curr) == k:
                ans.append(list(curr))
                return
            else:
                for i in range(start, n):
                    if i != start and nums[i] == nums[i-1]:
                        continue
                    curr.append(nums[i])
                    backtrack(k, curr, i + 1)
                    curr.pop()
        for k in range(n + 1):
            backtrack(k, [], 0)
        return ans
```