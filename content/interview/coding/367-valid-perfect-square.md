---
slug: "367-valid-perfect-square"
section: "coding"
title: "367. Valid Perfect Square"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674943958
updated_at: 1674943975
published_at: 1674943958
---
[367\. Valid Perfect Square](https://leetcode.com/problems/valid-perfect-square/)

```python
class Solution:
    def isPerfectSquare(self, num: int) -> bool:  
        if num == 1:
            return True
        left = 1
        right = num // 2

        while left <= right:
            mid = left + (right - left) // 2
            square = mid * mid
            if square == num:
                return True
            elif square > num:
                right = mid - 1
            elif square < num:
                left = mid + 1

        return False
```