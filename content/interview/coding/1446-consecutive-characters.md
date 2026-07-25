---
slug: "1446-consecutive-characters"
section: "coding"
title: "1446. Consecutive Characters"
status: "published"
pinned: false
tags: ["Other"]
created_at: 1674972898
updated_at: 1674972898
published_at: 1674972898
---
[1446\. Consecutive Characters](https://leetcode.com/problems/consecutive-characters/)

```python
class Solution:
    def maxPower(self, s: str) -> int:
        prev = s[0]
        count = 1
        res = 1
        for curr in range(1, len(s)):
            if s[curr] == prev:
                count += 1
                res = max(res, count)
            else:
                prev = s[curr]
                count = 1
        return res

```