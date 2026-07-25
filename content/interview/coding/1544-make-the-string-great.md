---
slug: "1544-make-the-string-great"
section: "coding"
title: "1544. Make The String Great"
status: "published"
pinned: false
tags: ["Stack"]
created_at: 1743564460
updated_at: 1743564475
published_at: 1743564460
---
[1544\. Make The String Great](https://leetcode.com/problems/make-the-string-great/)

```python
class Solution:
    def makeGood(self, s: str) -> str:
        
        if len(s) == 0:
            return s
        
        res = []
        
        for c in s:
            if res:
                if res[-1].upper() == c.upper():
                    if (res[-1].isupper() and c.islower()) or (res[-1].islower() and c.isupper()):   
                        res.pop()
                        continue
            res.append(c)
        return ''.join(res)
            
```