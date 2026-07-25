---
slug: "167-two-sum-ii-input-array-is-sorted"
section: "coding"
title: "167. Two Sum II - Input array is sorted"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973112
updated_at: 1674973112
published_at: 1674973112
---
[167\. Two Sum II - Input array is sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

如果已經排序好了，可以直接用 2 Sum 雙指針的方法。

```python
class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        left = 0
        right = len(numbers) - 1
        while left < right:
            total = numbers[left] + numbers[right]
            if total == target:
                return [left + 1, right + 1]
            elif total < target:
                left += 1
            elif total > target:
                right -= 1

        return [-1, -1]

```