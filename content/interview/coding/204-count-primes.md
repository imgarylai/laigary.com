---
slug: "204-count-primes"
section: "coding"
title: "204. Count Primes"
status: "published"
pinned: false
tags: ["Math"]
created_at: 1674972899
updated_at: 1674972899
published_at: 1674972899
---
[204\. Count Primes](https://leetcode.com/problems/count-primes/)

這個題目屬於數學題，題目要找的是小於 `n` 的數字中，有多少質數存在？

直覺的想法我們就遍歷所有的數字，並且一個一個檢查，這個數字是不是質數？那題目困難的地方就是想不想的到怎麼確定質數的數學式用電腦寫出來。

```python
class Solution:
    def isPrimeNumber(self, n):
        for i in range(2, int(n**0.5)+1):
            if n % i == 0:
                return False
        return n > 1

    def countPrimes(self, n: int) -> int:
        count = 0
        for i in range(n):
            if self.isPrimeNumber(i):
                count += 1

        return count

```

不過這樣的檢查方式是很沒有效率的，時間複雜度是～ $O(n^2)$ ，而且大多數的數字都不是質數，當數字越大，質數出現的機會會越小，這樣直覺的寫法，在 LeetCode 上面會出現超時。

這個題目有一個演算法叫做：[Sieve of Eratosthenes](https://zh.wikipedia.org/wiki/%E5%9F%83%E6%8B%89%E6%89%98%E6%96%AF%E7%89%B9%E5%B0%BC%E7%AD%9B%E6%B3%95) （又稱愛氏篩也稱質數篩）更快的找到我們想要找到的答案，這個演算法的想法是，一但我找到了一個質數，那我們就知道只要是這個質數的倍數就一定不是質數，直接標記起來，就可以跳過非常多的運算資源來搜尋目標。

一般來說面試的題目比較少考由某個人所發明出的演算法，如同我所提過的人類智慧結晶之考題通常是不考的。不過這個演算法的概念其實很簡單也很棒，是可以變成一種 Follow up 問題，讓面試官給你提示後，看你怎麼去把演算法寫出來，而且這個演算法的資料結構不是特殊的資料結構，值得花時間理解他的原理。

## 質數篩

```python
class Solution:
    def countPrimes(self, n: int) -> int:
        if n < 2:
            return 0
        memo = [True] * n

        for i in range(2, n):
            if memo[i]:
                j = i**2
                while j < n:
                    memo[j] = False
                    j += i

        count = 0
        for i in range(2, n):
            if memo[i]:
                count += 1

        return count

```