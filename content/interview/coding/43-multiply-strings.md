---
slug: "43-multiply-strings"
section: "coding"
title: "43. Multiply Strings"
status: "published"
pinned: false
tags: ["String"]
created_at: 1674972900
updated_at: 1674972900
published_at: 1674972900
---
[43\. Multiply Strings](https://leetcode.com/problems/multiply-strings/)

這個題目在 Python 真的非常簡單，加上題目給的數字又非常小，一行就可以寫出來。

```python
class Solution:
    def multiply(self, num1: str, num2: str) -> str:
        return str(int(num1) * int(num2))

```

不過這個題目其實考的是一個很常見的字串轉換的題目，題目給定的輸入，也可以是兩組陣列，回傳結果也是一個陣列。

```python
class Solution:
    def toNum(self, s: str) -> int:
        res = 0
        i = 0
        while i < len(s):
            res = 10 * res + int(s[i])
            i += 1
        return res

    def toS(self, num: int) -> str:
        if num == 0:
            return '0'
        res = ''
        while num > 0:
            res = str(num % 10) + res
            num //= 10
        return res

    def multiply(self, num1: str, num2: str) -> str:

        num1 = self.toNum(num1)
        num2 = self.toNum(num2)

        return self.toS(num1 * num2)

```