---
slug: "227-basic-calculator-ii"
section: "coding"
title: "227. Basic Calculator II"
status: "published"
pinned: false
tags: ["Classic", "Stack"]
created_at: 1674973113
updated_at: 1784703566
published_at: 1674973113
---
[227. Basic Calculator II](https://leetcode.com/problems/basic-calculator-ii/)

Calculator 的題組有

- [**224. Basic Calculator**](/interview/coding/224-basic-calculator)
- [**227. Basic Calculator II**](/interview/coding/227-basic-calculator-ii)
- [**772. Basic Calculator III**](/interview/coding/772-basic-calculator-iii)

但是難度不是按照順序遞增的，這一題才是題目的基礎功。

基本上處理這種文字順序題目的題目都和 [394. Decode String](/interview/coding/394-decode-string) 一樣，首先想到的會是需要用 Stack 來處理。

在 decode string 的題目裡面，我們知道何時要開始 pop ，但是在四則運算裡面，運算符並不是開始 pop 的地方。

例如： "2 + 3" ，當我走到加號的時候，我需要知道後面的 3 我才能做完運算，所以我們應該是要等到走到 3 的時候，再開始處理。

我們可以看另一個例子：" 2 - 3 + 1" 好了，什麼時候要處理 3 呢？我們要處理 3 ，就會是在 3 之後的加號這裡停下來，開始處理加號前面的內容，但是前面的運算符是減號，所以我應該要記錄前一個運算符號是什麼，接著我也要記錄我當前的運算符號是什麼給後面的 process 來得知。

這就是為什麼我們的答案裡面，需要有 sign 去記錄，然後題目有限制一定不會出現用正負號代表數字的正與負值，只會用做運算符號，所以開始的數字一定是正數，我們可以用加號來處理。

```python
class Solution:
    def calculate(self, s: str) -> int:
        num, stack, sign = 0, [], "+"
        for i in range(len(s)):
            if s[i].isdigit():
                num = num * 10 + int(s[i])
            if s[i] in "+-*/" or i == len(s) - 1:
                if sign == "+":
                    stack.append(num)
                elif sign == "-":
                    stack.append(-num)
                elif sign == "*":
                    stack.append(stack.pop()*num)
                else:
                    stack.append(int(stack.pop()/num))
                num = 0
                sign = s[i]
        return sum(stack)

```

