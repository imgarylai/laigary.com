---
slug: "67-add-binary"
section: "coding"
title: "67. Add Binary"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973112
updated_at: 1674973112
published_at: 1674973112
---
[67\. Add Binary](https://leetcode.com/problems/add-binary/)

```python
class Solution:
    def addBinary(self, a: str, b: str) -> str:
        res = ''
        if len(a) > len(b):
            b = '0'*(len(a) - len(b)) + b
        else:
            a = '0'*(len(b) - len(a)) + a

        n = len(a)
        carry = False

        for i in reversed(range(n)):
            if carry:
                if a[i] == b[i]:
                    res += '1'
                    if a[i] == '0':
                        carry = False
                else:
                    res += '0'
            else:
                if a[i] == b[i]:
                    res += '0'
                    if a[i] == '1':
                        carry = True
                else:
                    res += '1'
        if carry:
            res += '1'

        return res[::-1]

```