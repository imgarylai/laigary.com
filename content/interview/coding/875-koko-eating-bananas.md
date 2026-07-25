---
slug: "875-koko-eating-bananas"
section: "coding"
title: "875. Koko Eating Bananas"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674944207
updated_at: 1784934576
published_at: 1674944207
---
[875. Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/)

參考 [1011. Capacity To Ship Packages Within D Days](/interview/coding/1011-capacity-to-ship-packages-within-d-days)

> 文末是我過去不熟開、閉區間的做法所寫的答案，後來我都習慣使用閉區間來寫。

這個題目是二分搜索的變形問題，題目用這樣的敘述來問：如果 Koko 每小時吃 k 根香蕉，吃完全部需要幾小時？題目的關鍵規則（也是最容易忘的地方）Koko 一小時只吃**一堆**。如果這堆不夠 k 根，她吃完就停手，**剩下的時間浪費掉，不會接著吃下一堆**。

這條規則就是整個函式的來源——它讓「吃不滿的那小時」也要算一整個小時。

`h` 是**期限**：Koko 總共只有 h 小時可以吃，必須在這段時間內把所有香蕉吃完。

警衛 h 小時後會回來。所以 Koko 要挑一個速度 k，讓她趕在警衛回來前吃完——而且她想吃得**越慢越好**（k 越小越好），因為她懶。

```py
class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        

        left = 1
        right = max(piles)

        def getH(k):
            hours = 0
            for pile in piles:
                hours += pile // k
                if pile % k != 0:
                    hours += 1
            return hours

        while left <= right:
            k = left + (right - left) // 2
            hours = getH(k)
            if getH(k) > h:      # 太慢，速度要更快
                left = k + 1
            else:                # 來得及，試試更慢的
                right = k - 1

        return left
```

---

```python
class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        

        def helper(speed): # 計算 koko 要花多少時間吃完
            hours = 0
            for pile in piles:
                hours += (pile + speed - 1) // speed
            return hours

        
        left = 1
        right = 1000000000 + 1

        while left < right:
            speed = left + (right - left) // 2
            if helper(speed) <= h: # 當前 speed 足夠快可以在 h 時間內吃完
                right = speed
            else: # 當前 speed 不夠快可以在 h 時間內吃完
                left = speed + 1
        
        # while 終止時 left == right 此時回傳 left 或是 right 都是可以的
        
        return right
```

