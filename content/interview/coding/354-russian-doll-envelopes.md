---
slug: "354-russian-doll-envelopes"
section: "coding"
title: "354. Russian Doll Envelopes"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973128
updated_at: 1675042262
published_at: 1674973128
---
[354\. Russian Doll Envelopes](https://leetcode.com/problems/russian-doll-envelopes/)

這一題難度困難，最終的解法不難，難點是需要一點小技巧，跟怎麼推敲出題目的核心。

題目是我們有多封信封，長寬不一，我們要把小的信封放進大的信封，再放入更大的信封…依序下去。但是信封之間有可能完全沒辦法互相套入，例如，`[1,3]` 和 `[2,4]` ，前面的信封可以套入到後面的信封，我們就將其套入，但像是`[1,5]` 和 `[2,4]`，這時候就不再套入，最後我們要算出都套入完之後，套最多信封的那個信封有幾個信封。

這題的限制是前一個的信封的長寬，要小於下一個信封的長寬，如果我們在現實生活中，我們要套的話，我們會怎麼找信封呢？

直覺的想法是，我一定是要先找出長和寬都相對最大的信封，因為這樣最有可能裝入最多的小信封，或者是，我手上拿著的信封，如果我要找下一個信封套著我，這個信封的長寬一定是要比我們現在這個信封大。下一個數字一定要嚴格的比我現在的數字大，這個題目就很像是遞增子序列，又我們要找到最多信封的套法，就變成要找了最長遞增子序列的問題。這個邏輯並不好想，我也是直接看別人的做法才知道的，不過可以先嘗試知道這個邏輯後，就開始自己試試看能不能做出來，剩下的實作就沒有難度了。

但是我們拿到的是一個二維的陣列，要如何找出最長遞增子序列呢？首先我們需要先按照寬度，由小到大排列好，接著按照高度，由大到小排列好。這裡是這個題目的第二個難點，就是為什麼高度是要從大到小排列好，因為會有寬度一樣的情況，如果高度我們也從小到大排列好，那我們在找最長遞增子序列的時候，就會把寬度一樣的信封通通都套在一起，這樣是不符合題目的意思的。

因此題目就變成兩個部分，第一個部分是排序，排序可以看我整理的 [Python 排序技巧](/interview/coding?tag=Sorting)。

```python
# 依陣列的第一個位置升冪排序，第二個位置降冪排序
envelopes.sort(key=lambda x: (x[0], -x[1]))
# 把每個信封的高度取出（第二個元素），之後要去找這個陣列的最長遞增子序列。
nums = []
for i in range(len(envelopes)):
    nums.append(envelopes[i][1])

```

到了這一步後，就是題目 [300\. Longest Increasing Subsequence](/interview/coding/300-longest-increasing-subsequence) 的題目輸出了！Cheers！

```python
class Solution:
    def maxEnvelopes(self, envelopes: List[List[int]]) -> int:
        envelopes.sort(key=lambda x: (x[0], -x[1]))
        nums = []
        for i in range(len(envelopes)):
            nums.append(envelopes[i][1])

        piles = []
        for i in range(len(nums)):
            card = nums[i]

            left, right = 0, len(piles)
            while left < right:
                mid = left + (right - left) // 2
                if piles[mid][-1] >= card:
                    right = mid
                else: # piles[mid][-1] < card:
                    left = mid + 1

            if left == len(piles):
                piles.append([])
            piles[left].append(card)
        return len(piles)

```