---
slug: "224-basic-calculator"
section: "coding"
title: "224. Basic Calculator"
status: "published"
pinned: false
tags: ["Classic", "Stack"]
created_at: 1674973112
updated_at: 1784702444
published_at: 1674973112
---
[224. Basic Calculator](https://leetcode.com/problems/basic-calculator/)

> 先做 [227. Basic Calculator II](/interview/coding/227-basic-calculator-ii) 和 [394. Decode String](/interview/coding/394-decode-string)

```python
class Solution:
    def calculate(self, s: str) -> int:
        def helper(s):
            num = 0
            stack = []
            sign = '+'
            while s:
                c = s.popleft()
                if c.isdigit():
                    num = 10 * num + int(c)
                if c == '(':
                    num = helper(s)
                if not c.isdigit() and not c.isspace() or len(s) == 0:
                    if sign == '+':
                        stack.append(num)
                    elif sign == '-':
                        stack.append(-num)
                    elif sign == '*':
                        stack.append(stack.pop() * num)
                    elif sign == '/':
                        stack.append(int(stack.pop() / num))
                    sign = c
                    num = 0
                if c == ')': break
            return sum(stack)
        return helper(deque(list(s)))

```

