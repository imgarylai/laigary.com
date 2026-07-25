---
slug: "673-number-of-longest-increasing-subsequence"
section: "coding"
title: "673. Number of Longest Increasing Subsequence"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973113
updated_at: 1674973113
published_at: 1674973113
---
[673\. Number of Longest Increasing Subsequence](https://leetcode.com/problems/number-of-longest-increasing-subsequence/)

## Prerequisite

{% page-ref page="longest-increasing-subsequence.md" %}

核心和 [300\. Longest Increasing Subsequence](/interview/coding/300-longest-increasing-subsequence) 一樣，不過除了要記錄的是當前的最長上升子序列的長度外，要外去記憶有多少種路徑可以到，可以用 `tuple` 記錄`（當前最長上升子序列的長度，前面有幾種路徑）` 。

一開始的初始值都是 `1` ，是因為如果當下的最長上升子序列就是只有自己，那只有一種方式可以到達，像是題目中給的範例 `[2, 2, 2, 2, 2]` 的答案是 `5` 一樣。

計算出當前最長子序列的長度為合並不困難，和 [300\. Longest Increasing Subsequence](/interview/coding/300-longest-increasing-subsequence) 一樣。

這裡要注意的是要去計算出前面有多少個路徑可以到達我當前的位置，要是合法的路徑的話，必須滿足兩個條件：

1.  前方位置的數值，要比我現在的數值來的小，
2.  前方位置的 LIS 要剛好比我現在小 1 ，原因是因為：
3.  如果前一個位置的最長遞升子序列的長度和目前位置一樣的話，那代表的是這兩個位置應該都是要從另外一個更前方的位置一起往後跳的才對，這樣最長子序列的長度才合理。
4.  如果兩個位置差大於 1 的話，那就是代表跳不過來的。
5.  由此可推論，這個條件一定要是剛好最長子序列的長度要剛好差 1 。

```python
class Solution:
    def findNumberOfLIS(self, nums: List[int]) -> int:
        dp = [(1, 1) for _ in range(len(nums))]
        LIS = 1
        for i in range(1, len(nums)):
            curr, count = 1, 0
            # 先計算出當前的最長遞增子序列的最大長度為何
            for j in range(i):
                if nums[j] < nums[i]:
                    curr = max(curr, dp[j][0] + 1)
            LIS = max(LIS, curr)

            # 再去累加有哪些路徑可以到
            # 1. 一定要比我當前值還小
            # 2. 
            for j in range(i):
                if nums[j] < nums[i] and dp[j][0] == curr - 1:
                    count += dp[j][1]

            # 更新當前的最長遞增子序列和路徑組合
            dp[i] = (curr, max(count, dp[i][1]))

        ans = 0
        for item in dp:
            curr, count = item
            if curr == LIS:
                ans += count
        return ans

```