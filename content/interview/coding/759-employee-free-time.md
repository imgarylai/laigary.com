---
slug: "759-employee-free-time"
section: "coding"
title: "759. Employee Free Time"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973111
updated_at: 1766364869
published_at: 1674973111
---
[759\. Employee Free Time](https://leetcode.com/problems/employee-free-time/)

這題的題目是標記困難，改變的只有時間區間的表達方式改成了一個物件，而不是陣列，要給的答案是哪些時間是空閒的。

這題寫起來反而是秒殺，首先把所有員工的時間表都拿到，然後把需要合併的時間都合併起來，最後我們只要透過合併起來的時間表，就能反求初哪些時間是員工空閒的時間。

到此，時間區間的題目從最簡單到最難都用同樣的心法來處理，LeetCode 上已經沒有難題了！

```python
"""
# Definition for an Interval.
class Interval:
    def __init__(self, start: int = None, end: int = None):
        self.start = start
        self.end = end
"""

class Solution:
    def employeeFreeTime(self, schedule: '[[Interval]]') -> '[Interval]':

        intervals = []
        for interval in schedule:
            for i in interval:
                intervals.append([i.start, i.end])
        intervals.sort()
        stack = [intervals[0]]
        for i in range(1, len(intervals)):
            prevInterval = stack.pop()
            newInterval = intervals[i]
            if prevInterval[1] >= newInterval[0]:
                newInterval = [min(prevInterval[0], newInterval[0]), max(prevInterval[1], newInterval[1])]
            else:
                stack.append(prevInterval)
            stack.append(newInterval)

        if len(stack) <= 1:
            return []
        else:
            ans = []
            for i in range(1, len(stack)):
                ans.append(Interval(start=stack[i-1][1], end=stack[i][0]))
            return ans

```