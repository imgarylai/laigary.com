---
slug: "844-backspace-string-compare"
section: "coding"
title: "844. Backspace String Compare"
status: "published"
pinned: false
tags: ["Stack"]
created_at: 1743563003
updated_at: 1743563020
published_at: 1743563003
---
[844\. Backspace String Compare](https://leetcode.com/problems/backspace-string-compare/)  

```python
class Solution:
    def backspaceCompare(self, s: str, t: str) -> bool:
        
        a = []
        for i in range(len(s)):
            if s[i] == '#':
                if len(a) > 0:
                    a.pop()
            else:
                a.append(s[i])
        
        b = []
        for i in range(len(t)):
            if t[i] == '#':
                if len(b) > 0:
                    b.pop()
            else:
                b.append(t[i])
        
        return ''.join(a) == ''.join(b)

        
```