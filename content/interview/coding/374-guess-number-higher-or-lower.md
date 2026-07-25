---
slug: "374-guess-number-higher-or-lower"
section: "coding"
title: "374. Guess Number Higher or Lower"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674943809
updated_at: 1709523026
published_at: 1674943809
---
[374\. Guess Number Higher or Lower](https://leetcode.com/problems/guess-number-higher-or-lower/)

```python
# The guess API is already defined for you.
# @param num, your guess
# @return -1 if my number is lower, 1 if my number is higher, otherwise return 0
# def guess(num: int) -> int:

class Solution:
    def guessNumber(self, n: int) -> int:
        left = 1
        right = n
        while left <= right:
            mid = left + (right - left) // 2
            if guess(mid) == 1:
                left = mid + 1
            elif guess(mid) == -1:
                right = mid - 1
            else:
                return mid
```