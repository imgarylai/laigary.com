---
slug: "712-minimum-ascii-delete-sum-for-two-strings"
section: "coding"
title: "712. Minimum ASCII Delete Sum for Two Strings"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674949166
updated_at: 1709446210
published_at: 1674949166
---
[712\. Minimum ASCII Delete Sum for Two Strings](https://leetcode.com/problems/minimum-ascii-delete-sum-for-two-strings/)

概念和 [1143\. Longest Common Subsequence](/interview/coding/1143-longest-common-subsequence) 很類似，要注意的地方不同而已。

```python
class Solution:
    def minimumDeleteSum(self, s1: str, s2: str) -> int:

        @lru_cache(None)
        def helper(i, j):
            if i == len(s1) and j == len(s2):
                return 0
            elif i == len(s1):
                ans = 0
                while j < len(s2):
                    ans += ord(s2[j])
                    j += 1
                return ans
            elif j == len(s2):
                ans = 0
                while i < len(s1):
                    ans += ord(s1[i])
                    i += 1
                return ans
            elif s1[i] == s2[j]:
                return helper(i+1, j+1)
            else:
                return min(ord(s1[i]) + helper(i+1, j), ord(s2[j]) + helper(i, j+1))

        return helper(0, 0)
```