---
slug: "901-online-stock-span"
section: "coding"
title: "901. Online Stock Span"
status: "published"
pinned: false
tags: ["Monotonic", "Stack"]
created_at: 1743568371
updated_at: 1743568916
published_at: 1743568371
---
[901\. Online Stock Span](https://leetcode.com/problems/online-stock-span/)

這個題目真的算是非常難，沒有寫過的話面試真的很難有機會寫出來。

```python
class StockSpanner:

    def __init__(self):
        self.prices = []

    def next(self, price: int) -> int:
        count = 1
        while self.prices and self.prices[-1][0] <= price:
            prev = self.prices.pop()
            count += prev[1]
        self.prices.append([price, count])

        return count

# Your StockSpanner object will be instantiated and called as such:
# obj = StockSpanner()
# param_1 = obj.next(price)
```