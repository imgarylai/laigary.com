---
slug: "772-basic-calculator-iii"
section: "coding"
title: "772. Basic Calculator III"
status: "published"
pinned: false
tags: ["Classic", "Stack"]
created_at: 1674973112
updated_at: 1784702445
published_at: 1674973112
---
[772\. Basic Calculator III](https://leetcode.com/problems/basic-calculator-iii/)

前面兩題解完，此題題目有變化，答案無變化

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
                if c in '+-*/' or len(s) == 0:
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