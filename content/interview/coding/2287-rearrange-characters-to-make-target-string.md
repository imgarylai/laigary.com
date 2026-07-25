---
slug: "2287-rearrange-characters-to-make-target-string"
section: "coding"
title: "2287. Rearrange Characters to Make Target String"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1743744744
updated_at: 1743744864
published_at: 1743744744
---
[2287\. Rearrange Characters to Make Target String](https://leetcode.com/problems/rearrange-characters-to-make-target-string/)

同 [1189\. Maximum Number of Balloons](/interview/coding/1189-maximum-number-of-balloons)

```python
class Solution:
    def rearrangeCharacters(self, s: str, target: str) -> int:

        table = defaultdict(int)
            
        for c in s:
            table[c] += 1
        
        counter = Counter(target)
        
        mix = defaultdict(int)
        
        for key, val in counter.items():
            if key not in table:
                return 0
            else:
                mix[key] += table[key] / val
        
        res = float('inf')
        for key, val in mix.items():
            res = min(res, mix[key])
            
        
        return int(res)
```