---
slug: "372-super-pow"
section: "coding"
title: "372. Super Pow"
status: "published"
pinned: false
tags: ["Math"]
created_at: 1674972901
updated_at: 1674972901
published_at: 1674972901
---
[372\. Super Pow](https://leetcode.com/problems/super-pow/)

這題放在數學的分類題型，因為數學題型的題目，有時候其實是很難看得出來要怎麼去寫出程式的，像是這一題，看起來雖然是考數學，不過其實是考遞迴。

這個題目問的問題非常簡單，要算出一個 $a^b$ 並求對 1336 的餘數，而 `a` 和 `b` 的表達方式很特別，那就是 a 是一個數字，但是 b 是以一個陣列來表達，像是 $10^{1024}$會以 `a=10, b=[1,0,2,4]` 的方式來表達。

因為我練習的語言是以 Python 為主，所以我就直接強硬的把 `b` 轉換乘整數，並且透過以下的方式來求解。

$$
a^b = \begin{cases} a \times a^{b-1} & \text{if b is an odd number.}\\ (a^{b/2})^2 & \text{if b is an even number.}\\ \end{cases}
$$

```python
class Solution:
    def __init__(self):
        self.base = 1337

    def myPow(self, m, n):
        if n == 0:
            return 1
        if n == 1:
            return m % self.base
        if n % 2 == 1:
            return m * self.mypow(m, n - 1) % self.base
        else:
            sub = self.mypow(m, n//2)
            return sub * sub % self.base

    def superPow(self, a: int, b: List[int]) -> int:
        m = a % self.base
        n = int(''.join(map(str, b)))
        return self.mypow(m, n)

```

LeetCode 上其實給過了，不過這樣寫其實有一個風險，那就是如果 b 是一個非常非常大的數字（很長的陣列），這樣轉換的時候可能造成整數的溢位。

上面的例子其實做過了[次方結合律（associative property）](https://zh.wikipedia.org/wiki/%E7%BB%93%E5%90%88%E5%BE%8B)，結合律也可以換個角度這樣做。

$$
\begin{equation} \begin{split} 2^{[1,0,2,4]} & = 2^{4} \times 2^{[1,0,2,0]} \\ & =2^{4} \times (2^{[1,0,2]})^{10} \end{split} \end{equation}
$$

$$
\begin{equation} \begin{split} 2^{[1,0,2]} & = 2^{2} \times 2^{[1,0, 0]} \\ & =2^{2} \times (2^{[1,0]})^{10} \end{split} \end{equation}
$$

上面的題目也會變成一個遞迴的形式，其實做的方式如下：

```python
class Solution:
    def __init__(self):
        self.base = 1337

    def myPow(self, m, n):
        m %= self.base
        if k == 0:
            return 1
        if k % 2 == 1:
            return m * self.myPow(m, n-1) % self.base
        else:
            sub = self.myPow(m, n//2)
            return sub * sub % self.base

    def superPow(self, a: int, b: List[int]) -> int:        
        if not b:
            return 1
        last = b.pop()
        first = self.myPow(a, last)
        second = self.myPow(self.superPow(a, b), 10)
        return (first * second) % self.base

```