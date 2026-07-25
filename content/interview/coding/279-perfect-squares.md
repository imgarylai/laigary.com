---
slug: "279-perfect-squares"
section: "coding"
title: "279. Perfect Squares"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674972897
updated_at: 1674972897
published_at: 1674972897
---
[279\. Perfect Squares](https://leetcode.com/problems/perfect-squares/)

這一個題目是一個非常彈性的題目，題目的問題非常簡單，找到最少個[完全平方數](https://zh.wikipedia.org/wiki/%E5%B9%B3%E6%96%B9%E6%95%B0)其總和為題目給定的 n 。

首先第一個要先想到的是，我們要找的完全平方數，一定是比這個數還來的小，因此我們就可以先計算出可以利用的完全平方數的範圍為何。

```python
perfect_nums = [i * i for i in range(1, int(n**0.5)+1)]

```

此時我們就可以建構出這個問題的樹是如何，以 `n = 12` 為例子，`perfect_nums = [1, 4, 9]` ，這個樹的樣子就會長得像這樣。

```python
             [12]
          [11, 8, 9]
[[10, 7, 2], [7, 4], [2]]
             ...

```
```python
class Solution:
    def numSquares(self, n: int) -> int:

        perfect_nums = [i ** 2 for i in range(1, int(n**0.5)+1)]
        @lru_cache(None)
        def dp(n):
            if n == 0:
                return 0
            return 1 + min([dp(n-num) for num in perfect_nums if num <= n])

        return dp(n)

```
```python
class Solution:
    def numSquares(self, n: int) -> int:

        perfect_nums = [i * i for i in range(1, int(n**0.5)+1)]

        queue = deque([n])
        level = 0

        while queue:
            level += 1
            size = len(queue)
            for i in range(size):
                node = queue.popleft()
                for child in perfect_nums:
                    if child == node:
                        return level
                    elif child > node:
                        break
                    else:
                        queue.append(node - child)

```