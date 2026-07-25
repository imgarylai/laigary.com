---
slug: "56-merge-intervals"
section: "coding"
title: "56. Merge Intervals"
status: "published"
pinned: false
tags: ["Classic", "Intervals"]
created_at: 1674973111
updated_at: 1766362935
published_at: 1674973111
---
[56\. Merge Intervals](https://leetcode.com/problems/merge-intervals/)

這題只要解過了 [252\. Meeting Rooms](/interview/coding/252-meeting-rooms) 、 [253\. Meeting Rooms II](/interview/coding/253-meeting-rooms-ii) 就會非常的簡單。

[252\. Meeting Rooms](/interview/coding/252-meeting-rooms) 有教過了我們如何判斷區間重疊，這一個題目是我們要如何把重疊的區間都合併起來，並且給出所有的新時間區間。

這個題目還算好想一點，既然我們知道結果是一個陣列，那我們一開始就把第一個時間區間放到儲存結果的陣列，假設就只有一個時間區間，這就會是答案了。

接下來，我們就從後面的每一個時間區間來判斷，要如何得知前一個開會的時間呢？就是結果陣列的最後一個時間區間，接下來判斷是否需要合併，這個題目和前面兩個題目相比，比較特別的地方是，如果前一個時間區間的結束時間和後一個時間區間的開始區間相同時，我們是要合併的。

基本上就只有兩種情況，需要合併和不需要合併

先看如果說兩個時間不需要合併，這個比較簡單，我們就把當下的時間區間繼續放入就好。

如果說需要合併呢？這時候我們就需要重新計算新的時間區間，我們先把前一個時間區間拿出來，而新的時間區間很好計算，計算好再重新放入結果的陣列裡面。

```text
新的時間區間 = [兩個時間區間比較早的開始時間, 兩個時間區間比較晚的結束時間]

```
```python
class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
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

但是上面的這個做法時間複雜度為 $O(nlog(n))$，其中有一個點是題目給定的時間區間已經是排序好的，我們插入了一個新的時間區間，就會無視原本排序好的意義。

既然是排序好的區間，那就代表一定存在一個線性時間 $O(n)$ 的解法。

這裡的想法是

1.  我們遍歷一次所有的區間
2.  如果當下的區間跟新的區間並沒有重疊，那我們就可以把當前的區間 `intervals[i]` 加入到結果，直到發現了重疊為止。
3.  當迴圈結束在 `i` 時，代表 `i` 這個位置的區間跟新加入的區間有重疊了。
4.  接著要處理有重疊區間的地方，處理的方式是我們開始更新 `newInterval`
    1.  新區間更新的邏輯是因為當前的 `interval[i]` 和 `newInterval`有重複，所以合併起來成為新的 `newInterval`
    2.  一直更新到 `newInterval` 的結束時間再也沒有和當前區間的開始時間重複時，代表新區間已經全部合併完所有衝突的時間了。
    3.  將更新完的 `newInterval` 放入到結果中
5.  剩下沒有處理完的區間都一定沒有重疊，依序把它們放入到結果中。

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

        merged.append(newInterval)

        while i < n:
            merged.append(intervals[i])
            i += 1

        return merged

        
```