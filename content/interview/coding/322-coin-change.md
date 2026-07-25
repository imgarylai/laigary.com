---
slug: "322-coin-change"
section: "coding"
title: "322. Coin Change"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674972901
updated_at: 1722819955
published_at: 1674972901
---
[322\. Coin Change](https://leetcode.com/problems/coin-change/)

題目會給定兩樣東西，一樣是總金額(amount)，一樣是硬幣的面額(coins)，題目要求我們找出透過不同的面額組合，找出使用最少枚硬幣的解法。

例如：總金額是 11 ，硬幣的面額是 `[1, 2, 5]`，那最少枚硬幣的方案即是使用兩枚 5 的硬幣，以及一枚 1 的硬幣，答案就是三枚。如果今天的金額是 3 硬幣只有 \[2\] 一個面額，湊不出組合的時候，那就回傳 -1 即可。

這是一個生活中很常見的組合，要使用最少枚硬幣，那一定是盡可能地把面額最大的硬幣拿來使用，當當前最大額的面額已經超過剩餘的金額時，往面額次大的硬幣來尋找可能的組合，依此類推找下去。

以上的想法我覺得是正確的方向，但是這個題目給定面額的時候，並沒有告訴我們硬幣的面額永遠都是從小到大排列，另外還有一個隱藏的問題是，會不會先使用最大的面額，結果導致剩餘的金額都無法被後面的面額給整除，那這樣也沒有意義。

以上的解法雖然好像可以更快的達到目標，但是後面帶來的兩個問題更有可能會把解法變得更複雜，這時候我們先往後一點去思考這個題目，那就是其實這個題目是可以靠窮舉的方式解決的，這也是電腦帶給我們的好處，那就是我們可以利用窮舉把所有的答案都計算出來，那找出最佳解就是很簡單的事情了。

而窮舉的方法很簡單那就是

$$
f(remaining) = 1 + min(f(remaining - coin[1]), f(remaining - coin[2]), ... f(remaining - coin[n]))
$$

整個題目就成了一個遞迴的題目。解法如下：

```python
class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        def helper(remaining):
            if remaining < 0:
                return -1
            elif remaining == 0:
                return 0
            else:
                # f(remaining) = 1 + min(f(remaining-coin[1]), ..., f(remaining-coin[n]))
                min_cost = float('inf')
                for coin in coins:
                    res = helper(remaining - coin)
                    if res != -1:
                        min_cost = min(min_cost, res + 1)
                if min_cost != float('inf'):
                    return min_cost
                else:
                    return -1
        return helper(amount)
```

題目雖然可以透過遞迴法的方式找到答案，但是以上的遞迴的結構存在著重複解，可以透過展開的方式去發現重複解，既然有包含了重複解，就可以使用動態規劃的方式來解題。

## Top-Down

可以繼續沿用遞迴的方式，在子問題中找到最佳解時，就記錄起來，減少遞迴的步驟。

```python
class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        
        mem = {}

        def helper(remaining):
            if remaining in mem:
                return mem[remaining]
            if remaining < 0:
                return -1
            elif remaining == 0:
                return 0
            else:
                min_cost = float('inf')
                for coin in coins:
                    res = helper(remaining - coin)
                    if res != -1:
                        min_cost = min(min_cost, res + 1)
                if min_cost != float('inf'):
                    mem[remaining] = min_cost
                else:
                    mem[remaining] = -1
                return mem[remaining]

        return helper(amount)
```

## Bottom-Up

Bottom up 的方式比較沒有這麼直覺，需要想一下，思考的方向是如果我們可以一步一步把動態規劃中的子問題給解決，那我們就可以透過已經建立好的子問題回答出最佳解。

```python
class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        # 如果沒有最佳解，則該解為無限大
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for i in range(len(dp)):
            for coin in coins:
                if i - coin >= 0:
                    dp[i] = min(dp[i], 1 + dp[i-coin])

        return -1 if dp[amount] == float('inf') else dp[amount]

```