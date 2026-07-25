---
slug: "intervals-template"
section: "coding"
title: "Intervals 模板"
status: "published"
pinned: false
tags: ["Intervals"]
created_at: 1784876687
updated_at: 1784876687
published_at: 1784876687
---
Intervals 題目的第一步幾乎都一樣：**排序**。排完之後只需要比較「前一段的結尾」和「下一段的開頭」，整題就變成一次線性掃描。

## 合併：按起點排序

```python
intervals.sort(key=lambda x: x[0])
merged = []
for start, end in intervals:
    if merged and start <= merged[-1][1]:      # 和前一段重疊
        merged[-1][1] = max(merged[-1][1], end)
    else:
        merged.append([start, end])
return merged
```

`max(merged[-1][1], end)` 不能省 — 前一段可能完全包住這一段（`[1,10]` 之後遇到 `[2,3]`），直接覆寫會把結尾改小。

例題：[56. Merge Intervals](/interview/coding/56-merge-intervals)、[57. Insert Interval](/interview/coding/57-insert-interval)

## 判斷有沒有重疊

排序後只要有一段的起點在前一段的結尾之前，就重疊了：

```python
intervals.sort()
for i in range(1, len(intervals)):
    if intervals[i][0] < intervals[i - 1][1]:
        return False
return True
```

先跟面試官確認**端點相接算不算重疊**（`[1,2]` 和 `[2,3]`）— 會議室題目通常不算，這決定了用 `<` 還是 `<=`。

例題：[252. Meeting Rooms](/interview/coding/252-meeting-rooms)

## 最少需要幾個資源：拆成兩條時間線

Meeting Rooms II 的經典解法是把區間**拆開**成「開始事件」和「結束事件」兩條排序好的時間線，然後用雙指針掃：

```python
starts = sorted(i[0] for i in intervals)
ends = sorted(i[1] for i in intervals)
rooms = used = 0
s = e = 0
while s < len(starts):
    if starts[s] < ends[e]:
        used += 1                # 有會議開始，佔用一間
        s += 1
    else:
        used -= 1                # 有會議結束，釋放一間
        e += 1
    rooms = max(rooms, used)
return rooms
```

另一種寫法是最小堆存「所有進行中會議的結束時間」，堆的大小就是同時需要的房間數 — 見 [Heap 模板](/interview/coding/heap-topk-template)。兩種都該會，面試時挑一種寫、提一句另一種。

例題：[253. Meeting Rooms II](/interview/coding/253-meeting-rooms-ii)

## 貪心：要「保留最多」就按結尾排序

這是最容易記錯的一條 — **合併按起點排，貪心選最多不重疊的區間要按結尾排**。因為結尾越早，留給後面的空間越多：

```python
intervals.sort(key=lambda x: x[1])     # 按結尾排！
count, prev_end = 0, float('-inf')
for start, end in intervals:
    if start >= prev_end:              # 不衝突就選
        count += 1
        prev_end = end
return len(intervals) - count          # 要移除的數量
```

例題：[435. Non-overlapping Intervals](/interview/coding/435-non-overlapping-intervals)、[452. Minimum Number of Arrows to Burst Balloons](/interview/coding/452-minimum-number-of-arrows-to-burst-balloons)

## 兩個已排序的區間列表求交集

兩個列表各一個指針，交集是「起點取大、結尾取小」，然後**結尾比較早的那一邊前進**：

```python
while i < len(A) and j < len(B):
    lo = max(A[i][0], B[j][0])
    hi = min(A[i][1], B[j][1])
    if lo <= hi:
        res.append([lo, hi])
    if A[i][1] < B[j][1]:
        i += 1
    else:
        j += 1
```

例題：[986. Interval List Intersections](/interview/coding/986-interval-list-intersections)、[1024. Video Stitching](/interview/coding/1024-video-stitching)

## 面試時的講法

第一句就講「我先排序」，並說明**按起點還是按結尾、為什麼** — 這是這類題目唯一的決策點，講對了後面都是機械式的掃描。複雜度由排序主導，是 $O(n \log n)$；如果輸入已經有序要主動說「那就降到 $O(n)$」。

更多題目 → [#Intervals](/interview/coding?tag=Intervals)
