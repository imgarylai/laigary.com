---
slug: "452-minimum-number-of-arrows-to-burst-balloons"
section: "coding"
title: "452. Minimum Number of Arrows to Burst Balloons"
status: "published"
pinned: false
tags: ["Classic", "Intervals"]
created_at: 1674973128
updated_at: 1710224818
published_at: 1674973128
---
[452\. Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/)

可以先看 [435\. Non-overlapping Intervals](/interview/coding/435-non-overlapping-intervals) 的最後一個解法

這個題目是希望我們可以用最少的箭矢去射破所有氣球，如果我們算出有幾個**「不重疊的區間」**，就代表我們需要幾支箭矢。

有一點比較特別的地方是，在之前的時間區間問題如果前一個時間區間的結束時間和當下的時間區間開始時間區間相同時（`prev[1] == prev[0]`）我們是算不重疊的區間，不過在這個題目，這樣算是重疊的區間，箭矢依然可以射破兩個區間。

所以我們要找到的不重疊區間，前一個時間區間的結束時間，要完全小於現在這個區間的開始時間。

```python
class Solution:
    def findMinArrowShots(self, points: List[List[int]]) -> int:
        
        points.sort(key = lambda x: x[1])
        right = points[0][1]
        count = 1

        for i in range(1, len(points)):
            if right >= points[i][0]:
                continue
            else:
                right = points[i][1]
                count += 1
        
        return count
```