---
slug: "1323-maximum-69-number"
section: "coding"
title: "1323. Maximum 69 Number"
status: "published"
pinned: false
tags: ["Greedy"]
created_at: 1761546680
updated_at: 1761546699
published_at: 1761546680
---
[1323\. Maximum 69 Number](https://leetcode.com/problems/maximum-69-number/)

```python
class Solution:
    def maximum69Number (self, num: int) -> int:
        
        s = str(num)
        
        res = []
        
        count = 1
        for i in range(len(s)):
            if s[i] == '9':
                res.append(s[i])
            else:
                if count == 1:
                    res.append('9')
                    count -= 1
                else:
                    res.append(s[i])
        
        return int(''.join(res))
```