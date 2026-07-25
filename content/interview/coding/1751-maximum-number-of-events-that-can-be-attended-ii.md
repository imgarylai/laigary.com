---
slug: "1751-maximum-number-of-events-that-can-be-attended-ii"
section: "coding"
title: "1751. Maximum Number of Events That Can Be Attended II"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1746323074
updated_at: 1746325444
published_at: 1746323074
---
[1751\. Maximum Number of Events That Can Be Attended II](https://leetcode.com/problems/maximum-number-of-events-that-can-be-attended-ii/)

這個題目算是滿好的面試題目，因為雖然他的難度是 Hard ，但是完全是可以透過推理的方式去找出答案，而且其實這滿容易在工作情的業務邏輯出現的。

這個題目會被歸類在 Hard 是因為題目可以從多個難度為 Medium 的題目出發，例如：

1.  不考慮會議的重要性，找出所有可以參加的會議
2.  不考慮最多可以參加幾個會議，最後參加會議的權重要最重...等

這個題目是給出，題目給定多個會議時間，以及會議的重要性，並且還限制上最多只能參加 `k` 個會議，找出最後的加權會議重要值為多少。

以下是我的第一個版本：

這個題目又是一個選擇的問題，因此很適合使用動態規劃的方式來寫，我的想法是，在每次選擇的時候我們考量的點是

1.  目前我們是不是已經選到足夠的會議數量 `k`
2.  如果還有會議可以選，我可以考慮
    1.  選擇這個會議，那如果要選擇這個會議要滿足
        1.  前一個會議的結束時間不能比當前會議晚

1.  不選擇這個會議

```python
class Solution:
    def maxValue(self, events: List[List[int]], k: int) -> int:
        events.sort(key=lambda x: x[1])
        
        @cache
        def dp(i, lastEndDay, selected):
            if i == len(events) or selected == k:
                return 0

            startDay, endDay, val = events[i]

            skip = dp(i + 1, lastEndDay, selected)
            pick = 0
            if startDay > lastEndDay:
                pick = val + dp(i + 1, endDay, selected + 1)
            return max(skip, pick)
        return dp(0, float('-inf'), 0)

```

不過雖然這個解答是對的，但是由於多了一個 `lastEndDay` 這個變數，會導致需要記憶的數量太多，導致記憶體不足。

這裡需要換一點思路來想，那就是如果現在我們選擇當前這個 `event` 了，是不是可以更快速的找到下一個？先前的方式如果說一個 event 的跨度很大，其實會有非常多的浪費。

```python
class Solution:
    def maxValue(self, events: List[List[int]], k: int) -> int:
        events.sort()
        start_days = [e[0] for e in events]
        
        @cache
        def dp(i, remaining):
            if i == len(events) or remaining == 0:
                return 0
            
            # skip this event
            res = dp(i + 1, remaining)
            
            # pick this event
            _, end, value = events[i]
            next_i = bisect_left(start_days, end + 1)
            res = max(res, value + dp(next_i, remaining - 1))
            return res

        return dp(0, k)
```