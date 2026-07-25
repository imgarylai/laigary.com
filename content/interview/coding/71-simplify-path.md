---
slug: "71-simplify-path"
section: "coding"
title: "71. Simplify Path"
status: "published"
pinned: false
tags: ["Stack"]
created_at: 1743563547
updated_at: 1743563564
published_at: 1743563547
---
[71\. Simplify Path](https://leetcode.com/problems/simplify-path/)

```python
class Solution:
    def simplifyPath(self, path: str) -> str:
        
        tmp = path.split('/')
        res = []
        for item in tmp:
            if item == '' or item == '.':
                continue
            elif item == '..':
                if len(res) > 0:
                    res.pop()
            else:
                res.append(item)
        
        return "/" + "/".join(res)
```