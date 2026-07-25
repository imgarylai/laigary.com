---
slug: "448-find-all-numbers-disappeared-in-an-array"
section: "coding"
title: "448. Find All Numbers Disappeared in an Array"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674965485
updated_at: 1674966433
published_at: 1674965485
---
[448\. Find All Numbers Disappeared in an Array](https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/)

這個題目的簡單做法是排序後再找，但是這樣的做法通常都是會被問到提供更好的解法。

關於解法其實也不難，那就是使用 Set 記錄起來有出現過的元素，之後從小走到大，再把沒有出現在 Set 裡面的數字記錄起來，那就可以找到解答了。

```python
class Solution:
    def findDisappearedNumbers(self, nums: List[int]) -> List[int]:
        m = len(nums)
        S = set(nums)
        ans = []
        for i in range(1, m + 1):
            if i not in S:
                ans.append(i)

        return ans

```