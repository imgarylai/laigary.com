---
slug: "383-ransom-note"
section: "coding"
title: "383. Ransom Note"
status: "published"
pinned: false
tags: ["Array", "Hash Table"]
created_at: 1698818049
updated_at: 1761274343
published_at: 1698818049
---
[383. Ransom Note](https://leetcode.com/problems/ransom-note/)  

```python
class Solution:
    def canConstruct(self, ransomNote: str, magazine: str) -> bool:
        counter = Counter(list(magazine))

        for ch in ransomNote:
            if ch in counter:
                if counter[ch] == 0:
                    return False
                counter[ch] -= 1
            else:
                return False
        
        return True
```
```python
class Solution:
    def canConstruct(self, ransomNote: str, magazine: str) -> bool:
        r = Counter(ransomNote)
        m = Counter(magazine)
        
        for key, val in r.items():
            if key not in m:
                return False
            if val > m[key]:
                return False
        
        return True
```

時間複雜度 $O(n)$

空間複雜度 $O(n)$