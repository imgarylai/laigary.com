---
slug: "20-valid-parentheses"
section: "coding"
title: "20. Valid Parentheses"
status: "published"
pinned: false
tags: ["Stack"]
created_at: 1674972899
updated_at: 1743482204
published_at: 1674972899
---
[20\. Valid Parentheses](https://leetcode.com/problems/valid-parentheses/)

這一題是利用 `Stack` 判斷左右方向的基礎題目，Stack 的特性就是先進後出（FILO, First In Last out），而括號的性質就是先進後出，理由很簡單，當出現一個左邊括號後，他的右邊括號一定是最晚處理的。

要判斷括號的合法性，就先從左邊開始解析，如果發現任何一個括號的左側，我們就放進去 Stack ，一直到如果說遇到了右邊類型的括號，如果是右邊類型的括號，那我們就從 Stack 的最後一個位置判斷，看看是不是成對的，如果是的話就繼續走下去，如果不是成對的，就代表括號的合法性有誤。

```python
class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        for c in s:
            if c in ['(', '[', '{']:
                stack.append(c)
            else:
                if len(stack) == 0:
                    return False
                top = stack.pop()
                if c == ')':
                    if top != '(':
                        return False
                elif c == ']':
                    if top != '[':
                        return False
                elif c == '}':
                    if top != '{':
                        return False
        return len(stack) == 0

```