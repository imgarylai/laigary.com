---
slug: "57-insert-interval"
section: "coding"
title: "57. Insert Interval"
status: "published"
pinned: false
tags: ["Classic", "Intervals"]
created_at: 1674973113
updated_at: 1784667392
published_at: 1674973113
---
[57. Insert Interval](https://leetcode.com/problems/insert-interval/)

這題的解法很簡單，直接把新的區間加入進去，重新使用 [56. Merge Intervals](/interview/coding/56-merge-intervals) 題的解法。

```python
class Solution:
    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        intervals.append(newInterval)
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
        return stack

```

其實這樣的時間複雜度已經滿不錯的，就是 $O(N \log N)$ ，主要的時間會花在排序上面，但是這個題目給定的條件，和前面幾題不一樣，那就是給的時間表，早就已經排序過了。所以如果說直接加入到最後面，用 sort 排序的話，是很沒有效率的，雖然 LeetCode是給過的。

解法很簡單，直接找到哪裡需要插入，插入到那個位置就好。

這樣整個題目的時間複雜度就會在 $O(N)$ 。

```python
class Solution:
    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        new_intervals = []
        insertIndex = len(intervals)
        for i in range(len(intervals)):
            if intervals[i][0] > newInterval[0]:
                insertIndex = i
                break
        intervals.insert(insertIndex, newInterval)
        stack = [intervals[0]]
        for i in range(1, len(intervals)):
            prevInterval = stack.pop()
            newInterval = intervals[i]
            if prevInterval[1] >= newInterval[0]:
                newInterval = [min(prevInterval[0], newInterval[0]), max(prevInterval[1], newInterval[1])]
            else:
                stack.append(prevInterval)
            stack.append(newInterval)
        return stack
```

```python
class Solution:
    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        merged = []

        i = 0
        n = len(intervals)

        # newInterval has no overlap
        while i < n and intervals[i][1] < newInterval[0]:
            merged.append(intervals[i])
            i += 1
            
        # overlap is detected
        # intervals[i][1] >= newInterval[0]

        # Keep update new interval
        while i < n and newInterval[1] >= intervals[i][0]:
            newInterval = [min(intervals[i][0], newInterval[0]), max(intervals[i][1], newInterval[1])]
            i += 1

        # merge new interval
        merged.append(newInterval)

        # merge rest non-overlap intervals 
        while i < n:
            merged.append(intervals[i])
            i += 1

        return merged
```

