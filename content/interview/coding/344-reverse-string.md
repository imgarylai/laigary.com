---
slug: "344-reverse-string"
section: "coding"
title: "344. Reverse String"
status: "published"
pinned: false
tags: ["String"]
created_at: 1674972899
updated_at: 1674972899
published_at: 1674972899
---
[344\. Reverse String](https://leetcode.com/problems/reverse-string/)

這一題並不難，主要是熟悉用不同的方式來完成同樣的一件事情

## 雙指針

```python
class Solution:
    def reverseString(self, s: List[str]) -> None:
        """
        Do not return anything, modify s in-place instead.
        """
        left = 0
        right = len(s) - 1
        while left <= right:
            s[left], s[right] = s[right], s[left]
            left += 1
            right -=1

```

## 遞迴

```python
class Solution:
    def reverseString(self, s: List[str]) -> None:
        """
        Do not return anything, modify s in-place instead.
        """
        def helper(left, right):
            if left <= right:
                s[left], s[right] = s[right], s[left]
                helper(left + 1, right - 1)

        helper(0, len(s) - 1)

```