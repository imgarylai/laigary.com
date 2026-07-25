---
slug: "394-decode-string"
section: "coding"
title: "394. Decode String"
status: "published"
pinned: false
tags: ["Stack"]
created_at: 1674972898
updated_at: 1784700588
published_at: 1674972898
---
[394. Decode String](https://leetcode.com/problems/decode-string/)

這一個題目是 Stack 常見的考題做法

1. 如果我們遇到連續的字元，就把「字元」不斷的組合起來
2. 如果我們遇到連續的字元，就把「數字」不斷的組合起來
3. 當遇上`[` 時，會先把「（當前的數值，以及目前的答案）」先存到 Stack 裡面，因為括號可能會有很多層，最先遇到括號的要最後處理，此時先把答案歸零，繼續處理子問題。
4. 當遇上 `]` 時，要把 Stack 最後一組數值拿出來處理，拿出來的會是之前完整的答案，現在要做的是把當前的答案組合出來，當前的答案的組法會是
5. 前方已經有的答案 + 括號前面的數字為重複次數乘上當前的答案。

```python
class Solution:
    def decodeString(self, s: str) -> str:
        stack = []
        digits = 0
        chars = ''
        for char in s:
            if char == '[':
                stack.append((chars, digits))
                chars = ''
                digits = 0
            elif char == ']':
                prevChars, prevDigits = stack.pop()
                chars = prevChars + prevDigits * chars
            elif char.isdigit():
                digits = digits * 10 + int(char)
            else:
                chars += char
        return chars

```

這一題一樣也可以用遞迴的方式來寫，類似於 [224. Basic Calculator](/interview/coding/224-basic-calculator) 的作法一樣，括號內的問題是可以用遞迴關係式來處理的。

```python
class Solution:
    def decodeString(self, s: str) -> str:
        index = 0
        def helper():
            nonlocal index
            res = ''
            while index < len(s) and s[index] != ']':
                if not s[index].isdigit():
                    res += s[index]
                    index += 1
                else:
                    digit = ''
                    while index < len(s) and s[index].isdigit():
                        digit += s[index]
                        index += 1
                    digit = int(digit)
                    index += 1
                    decodedString = helper()
                    index += 1
                    if digit > 0:
                        res = res + digit * decodedString
                        digit = 0
            return res
        return helper()

```

