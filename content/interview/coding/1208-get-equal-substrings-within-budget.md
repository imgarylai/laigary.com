---
slug: "1208-get-equal-substrings-within-budget"
section: "coding"
title: "1208. Get Equal Substrings Within Budget"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1742777061
updated_at: 1742788347
published_at: 1742777061
---
[1208\. Get Equal Substrings Within Budget](https://leetcode.com/problems/get-equal-substrings-within-budget/)

```python
class Solution:
    def equalSubstring(self, s: str, t: str, maxCost: int) -> int:
        maxLen = 0
        currCost = 0
        start = 0

        for i in range(len(s)):
            currCost += abs(ord(s[i]) - ord(t[i]))

            while currCost > maxCost:
                currCost -= abs(ord(s[start]) - ord(t[start]))
                start += 1
            
            maxLen = max(maxLen, i - start + 1)
        
        return maxLen
```