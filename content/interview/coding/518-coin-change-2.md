---
slug: "518-coin-change-2"
section: "coding"
title: "518. Coin Change 2"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674972900
updated_at: 1707803674
published_at: 1674972900
---
[518\. Coin Change 2](https://leetcode.com/problems/coin-change-2/)

這個題目是 [322 Coin Change](/interview/coding/322-coin-change) 的進階題目，該題是個動態規劃的問題，目標是要找到使用最少的硬幣組合，而這道題目並不要求找到最少的題目，而是要找出總共有幾種組合，這個題目就變成了一個窮舉的題目。

但是這個裡面的窮舉，只在乎某個面額的硬幣，總共使用了幾枚，並不在乎到底是用什麼數量排出的，例如當硬幣的面額有 `[1, 2]` 兩種，目標是要找到 `5` 元的硬幣，`[1, 2, 2]`, `[2, 1, 1]` 這兩種組合都是使用一枚一元、兩枚兩元，並不重複計算。

這也就是這個題目比較困難的地方

1.  既然是要窮舉，Backtracking 應該是最適合的，但是 Backtracking 會把各種排列組合都計算進去，當然可以透過一些方法在窮舉時排除掉重複的情況，但是多會增加時間複雜度。
2.  雖然是窮舉，但是我們可以把以上出現重複的組合，視為重複的子問題，也就是說如果我們知道怎麼樣的情況會是重複的子問題，就可以把窮舉改寫成動態規劃的表達式。

這時候可以先觀察這個題目窮舉的過程

1.  在選硬幣的過程中，可以把能選用的硬幣依照幣值大小排列好。
2.  如果從幣值最小的先選，通常可以選出最多枚，接著拿出部分最小值的硬幣，以面額次小的硬幣取代掉，不斷的重複這個過程，就可以知道最後有哪些組合了。
3.  如果從幣值最大的先選，通常會選出最少枚硬幣，接著每次拿出面額最大的硬幣，用面額次大的硬幣取代，不斷的重複這個過程，就可以知道最後有哪些組合了。

從上述的過程中，不管是從面額小的開始去選擇，還是從面額大的去選擇，基本上都可以找出答案，其中最重要的一個點就是，從當前的面額來看時，要往一個恆定的方向去找，那就是只能朝面額更大個方向去找，或是朝面更小的地方去找。

這樣的方式可以很有系統性地去找出所有的組合，不過這裡有一個但書，那就是題目並沒有告訴我們說所有的硬幣是依序排列的，所以透過上述的觀察，我們需要多做一個排序來完成我們的演算法。

這個題目其實存在著不需要先排序過的答案，但是我覺得面試時有著上述的觀察其實並沒有什麼不對，沒有寫過題目的人本來就會需要先透過觀察來完成題目的需求。

只是這裡存在著一個討論，那就是排序到底是有沒有必要的？例如：題目給定了 `[2, 1, 5]` ，那是不是可以先把 `2` 給利用完了後，再開始看 `1` 呢？其實仔細想一下，這完全是沒有問題的，因為其實這個題目的精髓是慢慢地取代掉面額，因此只要嚴格地從當前的位置選出要多少個，並且剩下的面額都是從右方的面額選取，那就依然可以窮舉出所有的選擇。排序其實只是方便人類去思考，對於電腦來說，這樣的記憶量是很輕鬆的。

這樣其實我們就可以完成了動態轉移方程，不過數學式我不知道怎麼表達，可以直接看一下的 code 。

## 自定向下

```python
class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        
        memo = {}
        
        @cache
        def dfs(remaining, index):
            if (remaining, index) in memo:
                return memo[(remaining, index)]
            if remaining < 0:
                memo[(remaining, index)] = 0
            elif remaining == 0:
                memo[(remaining, index)] = 1
            else:
                count = 0
                for i in range(index, len(coins)):
                    coin = coins[i]
                    count += dfs(remaining - coin, i)
                memo[(remaining, index)] = count
            return memo[(remaining, index)]
        
        return dfs(amount, 0)
```

## 自底向上

TODO

```python
class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        dp = [0] * (amount + 1)
        dp[0] = 1

        for coin in coins:
            for i in range(coin, amount + 1):
                dp[i] += dp[i - coin]
        return dp[amount]

```

## References:

-   [322 Coin Change](/interview/coding/322-coin-change)