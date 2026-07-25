---
slug: "278-first-bad-version"
section: "coding"
title: "278. First Bad Version"
status: "published"
pinned: false
tags: []
created_at: 1674944019
updated_at: 1709446124
published_at: 1674944019
---
[278\. First Bad Version](https://leetcode.com/problems/first-bad-version/)

1.  如果中間值是錯誤的版本，代表最早的錯誤版本在左區間
2.  如果中間值是正確的版本，代表最早的錯誤版本在右區間

```python
# The isBadVersion API is already defined for you.
# @param version, an integer
# @return an integer
# def isBadVersion(version):

class Solution:
    def firstBadVersion(self, n):
        """
        :type n: int
        :rtype: int
        """
        left = 1
        right = n
        while left < right:
            mid = left + (right - left) // 2
            if isBadVersion(mid):
                right = mid
            else:
                left = mid + 1

        return left
```