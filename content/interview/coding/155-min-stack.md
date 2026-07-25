---
slug: "155-min-stack"
section: "coding"
title: "155. Min Stack"
status: "published"
pinned: false
tags: ["Stack"]
created_at: 1674972900
updated_at: 1674972900
published_at: 1674972900
---
[155\. Min Stack](https://leetcode.com/problems/min-stack/)

這一題是一個物件導向設計題目，要設計出一個棧具有原本的功能，還要可以找到棧中的最小值，其實這個題目還真「簡單」，因為棧本身就是一個陣列，直接使用 `min` 這個 API 就可以找到最小值了，這裡的時間複雜度只有在 `getMin` 時達到最高峰為 $O(n)$ ，這樣的時間複雜度沒有真的很差，所以這個寫法還可以通過 LeetCode。

```python
class MinStack:

    def __init__(self):
        """
        initialize your data structure here.
        """
        self.stack = []

    def push(self, val: int) -> None:
        self.stack.append(val)

    def pop(self) -> None:
        self.stack.pop()

    def top(self) -> int:
        return self.stack[-1]


    def getMin(self) -> int:
        return min(self.stack)

```

不過很顯然這個不會是面試官要的答案，因為既然然這是一個物件，就會有存在著不斷被取用的可能，例如，如果一直有需要 `getMin` 的操作，時間複雜度還是會非常的高。這一題要想要怎麼優化的點在於，要怎麼樣不斷的得知與更新最小值？其實我們只要有一個變數例如：`self.minVal` ，就可以一直保有最小值為何，因為每次一個新的數字放進來棧，就可以更新這個值。不過這個方式是有問題的，那就是當執行出棧時，只有一個變數的話就不能得知更之前的最小值了，既然也需要記得最小值的歷史紀錄，所以這個最小值的記憶方式，也是要用一個棧但是這個棧只有在遇到入棧時的值是最小值的時候，才放進去。

而出棧時，如果遇到當下要出棧的值和當前的最小值相同，那最小值也需要出棧。

```python
class MinStack:

    def __init__(self):
        """
        initialize your data structure here.
        """
        self.stack = []
        self.min_stack = []

    def push(self, val: int) -> None:
        self.stack.append(val)
        if len(self.min_stack) == 0:
            self.min_stack.append(val)
        else:
            if self.min_stack[-1] >= val:
                self.min_stack.append(val)

    def pop(self) -> None:
        if not self.min_stack or not self.stack:
            return
        if self.min_stack[-1] == self.stack[-1]:
            self.min_stack.pop()
        self.stack.pop()

    def top(self) -> int:
        return self.stack[-1]


    def getMin(self) -> int:
        return self.min_stack[-1]

```

這樣的方法，入棧、出棧、查詢最小值的時間複雜度都是 $O(1)$ ，只是會需要額外花費空間複雜度。