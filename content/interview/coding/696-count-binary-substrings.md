---
slug: "696-count-binary-substrings"
section: "coding"
title: "696. Count Binary Substrings"
status: "published"
pinned: false
tags: ["String"]
created_at: 1674972900
updated_at: 1674972900
published_at: 1674972900
---
[696\. Count Binary Substrings](https://leetcode.com/problems/count-binary-substrings/)

```python
class Solution:
    def countBinarySubstrings(self, s: str) -> int:
        groups = [1]
        for i in range(1, len(s)):
            if s[i-1] != s[i]:
                groups.append(1)
            else:
                groups[-1] += 1
        ans = 0
        for i in range(1, len(groups)):
            ans += min(groups[i-1], groups[i])
        return ans

```