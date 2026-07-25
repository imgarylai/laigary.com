---
slug: "150-evaluate-reverse-polish-notation"
section: "coding"
title: "150. Evaluate Reverse Polish Notation"
status: "published"
pinned: false
tags: ["Stack"]
created_at: 1761520217
updated_at: 1761526307
published_at: 1761520217
---
[150\. Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation/)

這個題目是屬於如何使用 [Stack](/interview/coding?tag=Stack) 來紀錄處理四則運算的方法。Wiki：[逆波蘭表示法](https://zh.wikipedia.org/zh-tw/%E9%80%86%E6%B3%A2%E5%85%B0%E8%A1%A8%E7%A4%BA%E6%B3%95)，在逆波蘭記法中，所有[運算子](https://zh.wikipedia.org/wiki/%E9%81%8B%E7%AE%97%E5%AD%90)置於[運算元](https://zh.wikipedia.org/wiki/%E6%93%8D%E4%BD%9C%E6%95%B0)的後面，因此也被稱為**字尾表示法**、**後序表示法**。逆波蘭記法不需要括號來標識運算子的優先級。

逆波蘭表達式的[直譯器](https://zh.wikipedia.org/wiki/%E8%A7%A3%E9%87%8A%E5%99%A8)一般是基於[堆疊](https://zh.wikipedia.org/wiki/%E5%A0%86%E6%A0%88)的。解釋過程一般是：運算元入棧；遇到運算子時，運算元出棧，求值，將結果入棧；當一遍後，棧頂就是表達式的值。因此逆波蘭表達式的求值使用堆疊結構很容易實現，並且能很快求值。

```python
class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        stack = []

        for token in tokens:
            if token in "+-*/":
                a = stack.pop()
                b = stack.pop()
                if token == '+':
                    stack.append(a + b)
                elif token == '*':
                    stack.append(a * b)
                elif token == "-":
                    stack.append(b - a)
                elif token == '/':
                    stack.append(int(b/a))
            else:
                stack.append(int(token))
        return stack.pop()
```

時間複雜度為 $O(n)$

空間複雜度為 $O(n)$