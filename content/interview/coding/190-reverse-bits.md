---
slug: "190-reverse-bits"
section: "coding"
title: "190. Reverse Bits"
status: "published"
pinned: false
tags: ["Bit Manipulation"]
created_at: 1710097686
updated_at: 1710100963
published_at: 1710097686
---
[190\. Reverse Bits](https://leetcode.com/problems/reverse-bits/)

```python
class Solution:
    def reverseBits(self, n: int) -> int:
        res = 0
        power = 31
        
        while n:
            res += (n & 1) << power
            n = n >> 1
            power -= 1
        
        return res
```