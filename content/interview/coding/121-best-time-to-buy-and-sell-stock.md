---
slug: "121-best-time-to-buy-and-sell-stock"
section: "coding"
title: "121. Best Time to Buy and Sell Stock"
status: "published"
pinned: false
tags: ["Classic", "Dynamic Programming"]
created_at: 1674973128
updated_at: 1706592134
published_at: 1674973128
---
[121\. Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/)

這個題目算是面試的高頻題目，因為一個題目可以不斷的延伸，而且根據不同的條件，在延伸的過程中不需要更改太多的答案。所以這個題目的解法雖然簡單，但是熟悉各個解題的方法更是重要。

這個題目是給定一個歷史股價，且如果只能進行一次買賣，最大的獲利為何？

既然是要找最大獲利，即是股價的最低點與最高點之間的差，剛開始在寫刷題時，我就很天真的想那就找到歷史股價中的最大值與最小值，最大獲利就是兩個一相減就好，這就落入了一個很簡單的小陷阱，那就是股票的獲利一定是要先有參與市場，也就是先有了買入的動作，才會有賣出的動作（咦？我不能賣空嗎？😂）

也就是說最大獲利，不只是找到最低點的股價與最高點的股價，當買在了底點，還一定要賣得掉，當股價不斷的下跌，最大了獲利反而是不參與，整體獲利為零。

有了這個條件，其實這個題目變成了有暴力解的解法，那就是我在每個股價點，都去往回找，找出以前最小的股價點就好。

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        max_profit = 0

        for i in range(len(prices)):
            for j in range(i):
                if prices[i] > prices[j]:
                    max_profit = max(max_profit, prices[i] - prices[j])

        return max_profit
```

以上這樣的方法邏輯上沒有錯，但是當刷題刷久了，就會有一個感知是這個題目應該存在優化的地方，畢竟這個解法的時間複雜度是 $O(n^2)$。並且在 Leetcode 中會遇到 TLE 。

需要優化的地方很明顯，那就是每次檢查過去歷史股價低點是一件沒有意義的事情，股價的最低點出現在某個位置後，剩餘的震盪其實都是沒有必要的，因此在尋找的過程中，應該要記錄起來，又或是說其實可以先計算出歷史的股價低點紀錄：

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        
        historical_low_price = []
        historical_low_price.append(prices[0])
        for i in range(1, len(prices)):
            historical_low_price.append(min(historical_low_price[i - 1], prices[i]))
        

        max_profit = 0
        for i in range(len(prices)):
            if prices[i] > historical_low_price[i]:
                max_profit = max(max_profit, prices[i] - historical_low_price[i])

        return max_profit
```

如此一來，時間複雜度可以降低到 $O(n)$，但是空間複雜度也變成了 $O(n)$。

面試時，就有可能會被繼續問到，空間複雜度能不能降低呢？為什麼說空間複雜度可以被降低？以這個歷史股價為例子：

```text
[1, 2, 3, 4, 5, 6, 7]
```

其歷史股價低點的紀錄就會變成：

```text
[1, 1, 1, 1, 1, 1, 1]
```

似乎並不需要真的記錄所有的低點，真正重要的就是當股價到 `i` 天時，前面的最低點的價格就好。

題目已知的時間軸中，一開始的的價格就會是一開始的低點價格，而且這個價格其實是不可能可有任何獲利的，因為沒有買進，就不會有賣出，得知了這個標準，就可以開始檢查各個歷史股價，找出最大值了。

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:

        min_cost = prices[0]

        max_profit = 0
        for i in range(1, len(prices)):
            if prices[i] > min_cost:
                max_profit = max(max_profit, prices[i] - min_cost)
            min_cost = min(min_cost, prices[i])

        return max_profit

```

如同本文開頭所說，這個題目的做法很多且延伸也很多，當上面的做法都知道後，就可以展開其他的想法。

雖然說這個題目一定是刷題會刷到的題目，但是如果刷題刷多了，這個題目其實很像是給定一個陣列，透過不同的選擇，找出題目的最佳解，這個題目其實很符合動態規劃題目的模式，這個題目其實存在著很多比較直覺的解法，動態規劃其實是滿難想的。

TODO: 動態轉移方程

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:

        @cache
        def dfs(i, hold, remaining):
            if remaining == 0:
                return 0
            if i == len(prices):
                return 0

            do_nothing = dfs(i + 1, hold, remaining)

            do_something = 0

            if hold:
                do_something = prices[i] + dfs(i + 1, False, remaining - 1)
            else:
                do_something = -prices[i] + dfs(i + 1, True, remaining)

            return max(do_nothing, do_something)

        return dfs(0, False, 1)
```

## 相關題目

-   [122\. Best Time to Buy and Sell Stock II](/interview/coding/122-best-time-to-buy-and-sell-stock-ii)
-   [123\. Best Time to Buy and Sell Stock III](/interview/coding/123-best-time-to-buy-and-sell-stock-iii)
-   [188\. Best Time to Buy and Sell Stock IV](/interview/coding/188-best-time-to-buy-and-sell-stock-iv)
-   [309\. Best Time to Buy and Sell Stock with Cool down](/interview/coding/309-best-time-to-buy-and-sell-stock-with-cool-down)
-   [714\. Best Time to Buy and Sell Stock with Transaction Fee](/interview/coding/714-best-time-to-buy-and-sell-stock-with-transaction-fee)