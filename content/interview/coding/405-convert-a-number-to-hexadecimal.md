---
slug: "405-convert-a-number-to-hexadecimal"
section: "coding"
title: "405. Convert a Number to Hexadecimal"
status: "published"
pinned: false
tags: ["Bit Manipulation"]
created_at: 1710038183
updated_at: 1710095105
published_at: 1710038183
---
[405\. Convert a Number to Hexadecimal](https://leetcode.com/problems/convert-a-number-to-hexadecimal/)

💡

這個題目有一個知識點需要先複習：「[二補數](https://zh.wikipedia.org/wiki/%E4%BA%8C%E8%A3%9C%E6%95%B8)」

```python
class Solution:
    def toHex(self, num: int) -> str:
    
        if num == 0:
            return '0'
    
        if num < 0:
            num = (1 << 32) + num
        
        hex_digits = '0123456789abcdef'
        hex_num = ''
        
        while num > 0:
            digit = num % 16
            hex_digit = hex_digits[digit]
            hex_num = hex_digit + hex_num
            num //= 16
        
        return hex_num
```