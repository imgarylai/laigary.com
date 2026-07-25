---
slug: "93-restore-ip-addresses"
section: "coding"
title: "93. Restore IP Addresses"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1764571726
updated_at: 1764571792
published_at: 1764571726
---
[93\. Restore IP Addresses](https://leetcode.com/problems/restore-ip-addresses/)

> 參考 [131\. Palindrome Partitioning](/interview/coding/131-palindrome-partitioning)

```python
class Solution:
    def restoreIpAddresses(self, s: str) -> List[str]:
        if len(s) > 12 or len(s) < 4:
            return []
        
        res = []

        def isValid(start, end):
            l = end - start + 1
            if l <= 0 or l > 3:
                return False
            elif l == 1:
                return True
            else: # l > 1
                if s[start] == '0':
                    return False
                if int(s[start:start + + l]) <= 255:
                    return True
            return False


        def backtrack(curr, start):
            if start == len(s):
                if len(curr) == 4:
                    res.append(".".join(curr))
                return
            
            if len(curr) > 4:
                return
            
            for i in range(start, len(s)):
                if not isValid(start, i):
                    continue
                curr.append(s[start:i+1])
                backtrack(curr, i + 1)
                curr.pop()
        
        backtrack([], 0)

        return res
```