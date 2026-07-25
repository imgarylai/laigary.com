---
slug: "583-delete-operation-for-two-strings"
section: "coding"
title: "583. Delete Operation for Two Strings"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674949135
updated_at: 1674949155
published_at: 1674949135
---
[583\. Delete Operation for Two Strings](https://leetcode.com/problems/delete-operation-for-two-strings/)

兩個單字需要刪掉的字元，恰好是他們沒有重疊的字元，他們沒有重疊的字元，所以找出兩個字元的最長公共子字串，分別刪掉後，剩下的字元就是最少的刪除操作了。

```python
class Solution:
    def longestCommonSubsequence(self, word1: str, word2: str) -> int:
        @lru_cache(None)
        def helper(i, j):
            if i == len(word1) or j == len(word2):
                return 0
            if word1[i] == word2[j]:
                return 1 + helper(i+1, j+1)
            else:
                return max(helper(i+1, j), helper(i, j+1))
        return helper(0, 0)


    def minDistance(self, word1: str, word2: str) -> int:
        lcs = self.longestCommonSubsequence(word1, word2)

        return len(word1) + len(word2) - 2 * lcs
```