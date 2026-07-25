---
slug: "1024-video-stitching"
section: "coding"
title: "1024. Video Stitching"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973110
updated_at: 1674973110
published_at: 1674973110
---
[1024\. Video Stitching](https://leetcode.com/problems/video-stitching/)

這一題的題目是給定許多時間區間，要找到需要挑選幾個時間區間，可以覆蓋到滿足時間區間 `[0, time]` ，一個合理的時間區間可以是這樣的：

```python
clips = [[1, 3], [2, 4], [4, 11], [1, 2]]
time = 10
candidates = [[1, 3], [2, 4], [4, 11]]
ans = 3

```

時間區間我們會想到的就是要先針對時間去做排序，在這一題也不例外，不過一般的排序並不符合我們的期待，像是下面的例子：

```python
clips = [[0, 2], [0, 4], [0, 8], [0, 10], [2, 10]]
time = 10
candidates = [[0, 10]]
ans = 1

```

在這個例子裡面，我們需要的並不是 `[[0, 2], [2, 10]]` ，而是直接選擇 `[0, 10]` 就可以完成答案。透過這個例子來推論，開始時間的確需要按照升冪排列的方式去排，這樣首先還可以知道到底有沒有區間是從 0 開始的，如果沒有的話，根本不用考慮後面的區間，因為一定無法覆蓋到。

上面這個推論，可以更近一步的得出一個結論：「如果我們現在要選擇的時間區間開始的時間是 $t_{start}$ ，為了要滿足選擇最少的時間區間卻可以覆蓋最多的時間點，當下所選擇的時間區間一定會是所有以 $t_{start}$ 為開始時間區間中， $t_{end}$為最大值的那一個」，上面的例子我們應該要按照「開始時間升冪排列，並且透過結束時間降冪排列」。如何排序請參考：[排序技巧](/interview/coding?tag=Sorting)

```python
clips = [[0, 10], [0, 8], [0, 4], [0, 2], [2, 10]]
time = 10
candidates = [[0, 10]]
ans = 1

```

了解了上面的推論後，我們就可以繼續往下走，接下來我們要怎麼找到下一個開始的區間呢？一樣我們舉個例子。

```python
clips = [[0, 4], [2, 6], [3, 8], [5, 10], [8, 10]]
time = 10
candidates = [[0, 4], [3, 8], [8, 10]]
ans = 3

```

在這個例子中，當我們選定了「當下區間」時，下一個區間要滿足什麼條件呢？

下一個區間**開始時間**不可以晚於當下區間的**結束時間**，換句話說，當下區間的**結束時間**，要小於等於下一個區間的**開始時間**，否則會有時間區間沒有覆蓋到。

當選定了下一個時間區間後，要怎麼再找到下一個時間區間呢？再重複一次上面的步驟。並且在這個不斷尋找的步驟，記錄下來我們總共找了幾個區間。

那我們要怎麼結束這個迴圈呢？如果我們找到的時間區間的結束時間，已經大於 `time` ，那就代表我們已經成功了覆蓋了時間區間 `[0, time]` ，也就是題目存在著答案。

如果在找尋下一個區間的過程中，在抵達 `time` 時間前，就已經找不下去了，那就代表並不存在著此組合，按照題目要求，我們就回傳 `-1` 。

以上就是這個題目的邏輯，其實並不會很難想，不過要怎麼把邏輯寫成程式碼，需要細心一點。

```python
class Solution:
    def videoStitching(self, clips: List[List[int]], time: int) -> int:
        clips.sort(key=lambda x: (x[0],-x[1]))

        res = 0
        i = 0
        n = len(clips)
        currEnd = 0
        nextEnd = 0

        while i < n and clips[i][0] <= currEnd:
            while i < n and clips[i][0] <= currEnd:
                nextEnd = max(nextEnd, clips[i][1])
                i += 1
            res+=1
            currEnd = nextEnd
            if currEnd >= time:
                return res

        return -1

```