---
slug: "435-non-overlapping-intervals"
section: "coding"
title: "435. Non-overlapping Intervals"
status: "published"
pinned: false
tags: ["Classic", "Intervals"]
created_at: 1674973128
updated_at: 1710211826
published_at: 1674973128
---
[435\. Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/)

這一題比前面的系列題目還稍難一點，但是思維很像一樣需要先將時間區間排序好，接著的目標是要找到移除幾個區間才能讓所有的會議都沒有重複的時間，這一題不能先把可以合併的時間都合併起來，因為當我們都合併起來之後，就會找不到到底哪一個需要被合併。

當所有的區間都按照順序排好後，就可以從早到晚開始去兩兩個區間判斷，需要考慮的情況有三種：

1.  沒有重疊
2.  有重疊，但是前一個時間區間的「結束點」比當前區間的結束時間點還「晚」，刪除「其中」一個區間
3.  有重疊，但是前一個時間區間的「結束點」比當前區間的結束時間點還「早」，刪除「其中」一個區間

這題最困難的地方就是想出這三個斷點，以及後面所謂的「其中」要怎麼選擇。

接著我們要去看為什麼上面這段話還需要判斷結束時間點，先看第二個條件：

如果說「前」一個時間區間的「結束」時間比「當前」區間的「結束」時間晚，那我們一定是很直覺的要刪除「比較大」的區間，也就是「前」一個時間區間

```text
|-------------------| # previous
    |----|            # current

```

因為「前」一個時間區間如果結束時間非常的晚，後面有更多的時間區間有機會與此區間重疊，所以我們要把前一個時間區間**「刪掉」**。

接下來是第三種情況，如果「前」一個時間區間的「結束點」比當前區間的結束時間點還「早」，我們要選擇的是刪掉「當前」的這個時間區間

為什麼？因為我們的陣列是以開始時間升冪排列，當我們**「刪掉」**當前的時間區間的時候，下一個時間區間的開始時間只會更晚或頂多和現在的一樣，如果是更晚的話，就不會再有重疊了，拿如果是更早，也不可能早於當前時間的前一個時間區間的開始時間，那我們也只要等走到那邊之後再處理就好。而且就算我們都刪前一個時間區間，下一個時間區間和現在這個區間發生重疊且與前一個時間發生重疊一樣要從一選擇一個刪掉。所以不如我們就選擇刪掉當下的時間就好，盡可能地讓後面的區間不會和前面的時間區間重合。判斷式最終的結果就是：

```python
if intervals[prev][1] > intervals[i][0]:
    if intervals[prev][1] > intervals[i][1]:
        # 執行刪除前一個時間區間的動作
        TODO
    else:
        # 執行刪除當前時間的動作
        TODO
    # 計算有幾的區間被刪掉了
    count += 1
else:
    # 完全沒有重疊
    TODO

```

最後的答案：

```python
class Solution:            
    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
        intervals.sort()    

        keep = [intervals[0]]
        for i in range(1, len(intervals)):
            last = keep.pop()
            curr = intervals[i]
            if last[1] > curr[0]:
                if last[1] > curr[1]:
                    keep.append(curr)
                else:
                    keep.append(last)
            else:
                keep.append(last)
                keep.append(intervals[i])
        return len(intervals) - len(keep)

```

這個題目有一個更節省空間複雜度的做法，那就是將刪除的這個動作，只用一個指針來做，在這個題目裡面，可以透過的一個指針來指向前一個區間是所有時間區間中的哪一個區間，於是如果我們如果要刪除前一個區間的時候，我們就把指向前一個區間的指針移到當前這個指針，如果是要刪除當下的區間，那指向前一個時間區間的指針，就不用移動到當前的指針。

```python
class Solution:            
    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
        intervals.sort()    

        prev = 0
        count = 0
        for i in range(1, len(intervals)):
            if intervals[prev][1] > intervals[i][0]:
                if intervals[prev][1] > intervals[i][1]:
                    prev = i
                else:
                    prev = prev
                count += 1
            else:
                prev = i
        return count

```

一直以來的時間區間題目都是靠開始時間來做排序的，可是這一個題目可以幫助我們看從結束時間來排序的情況。

跟第一個解答的思維一樣，那就是我們會想要找到所有沒有重疊的時間區間，找到相減後就可以給出題目的答案。

```python
class Solution:            
    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
        intervals.sort(key=lambda x: (x[1], x[0]))
        end = intervals[0][1]
        keep = [intervals[0]]
        for i in range(1, len(intervals)):
            if intervals[i][0] >= end:
                # 找到下一個沒有重複的區間
                end = intervals[i][1]
                keep.append(intervals[i])
            else:
                # 如果重複，繼續找下一個
                continue

        return len(intervals) - len(keep)

```