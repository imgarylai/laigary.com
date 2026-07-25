---
slug: "201-bitwise-and-of-numbers-range"
section: "coding"
title: "201. Bitwise AND of Numbers Range"
status: "published"
pinned: false
tags: ["Bit Manipulation"]
created_at: 1710122725
updated_at: 1710122791
published_at: 1710122725
---
[201\. Bitwise AND of Numbers Range](https://leetcode.com/problems/bitwise-and-of-numbers-range/)

```python
class Solution:
    def rangeBitwiseAnd(self, left: int, right: int) -> int:

        res = left
        left += 1
        while left <= right:
            res = res & left
            left += 1
            
        return res
```
```python
class Solution:
    def rangeBitwiseAnd(self, m: int, n: int) -> int:
        shift = 0   
        # find the common 1-bits
        while m < n:
            m = m >> 1
            n = n >> 1
            shift += 1
        return m << shift
```

#### Brian Kernighan's Algorithm

```python
class Solution:
    def rangeBitwiseAnd(self, m: int, n: int) -> int:
        while m < n:
            # turn off rightmost 1-bit
            n = n & (n - 1)
        return m & n
```