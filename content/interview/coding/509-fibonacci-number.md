---
slug: "509-fibonacci-number"
section: "coding"
title: "509. Fibonacci Number"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674944319
updated_at: 1674944404
published_at: 1674944319
---
[509\. Fibonacci Number](https://leetcode.com/problems/fibonacci-number/)

這一題是所有介紹動態規劃最基礎的一個題目，題目要求[斐波那契數](https://zh.wikipedia.org/wiki/%E6%96%90%E6%B3%A2%E9%82%A3%E5%A5%91%E6%95%B0) ，根據題目定義，可以很簡單的寫出遞迴的方法。

## 遞迴

```python
class Solution:
    def fib(self, n: int) -> int:
        if n == 0:
            return 0
        elif n == 1:
            return 1
        else:
            return self.fib(n-1) + self.fib(n-2)
```

可是這個方法存在著很多的重複的子問題，所以可以用動態規劃的方法做。

## 自頂向下

```python
class Solution:
    def fib(self, n: int) -> int:
        table = defaultdict(int)
        table[1] = 1
        def traverse(n):
            # recursive
            if n <= 1:
                return table[n]
            if n in table:
                return table[n]
            else:
                table[n] = self.fib(n - 1) + self.fib(n - 2)
                return table[n]
        return traverse(n)
```

## 自底向上

```python
class Solution:
    def fib(self, n: int) -> int:
        memo = [0] * (n+1)
        memo[1] = 1
        for i in range(2, n+1):
            memo[i] = memo[i-1] + memo[i-2]

        return memo[n]
```

## 減少記憶體

```python
class Solution:    
    def fib(self, n: int) -> int:
        if n <= 1:
            return n
        first = 0
        second = 1
        for i in range(2, n + 1):
            first, second = second, first + second        
        return second
```