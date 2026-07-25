---
slug: "495-teemo-attacking"
section: "coding"
title: "495. Teemo Attacking"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973110
updated_at: 1674973110
published_at: 1674973110
---
[495\. Teemo Attacking](https://leetcode.com/problems/teemo-attacking/)

這題如果已經寫過前面一系列的題目，那就沒有難度了，題目的主軸變成，只給你開始的時間，但是每個開會的時間長度一樣，然後再把有重疊的時間全部合併起來。

```python
class Solution:
    def findPoisonedDuration(self, timeSeries: List[int], duration: int) -> int:
        intervals = []
        for time in timeSeries:
            intervals.append([time, time+duration-1])
        stack = [intervals[0]]
        for i in range(1, len(intervals)):
            prevInterval = stack.pop()
            newInterval = intervals[i]
            if prevInterval[1] >= newInterval[0]:
                newInterval = [min(prevInterval[0], newInterval[0]), max(prevInterval[1], newInterval[1])]
            else:
                stack.append(prevInterval)
            stack.append(newInterval)
        ans = 0
        for time in stack:
            ans += (time[1] - time[0] + 1)
        return ans

```