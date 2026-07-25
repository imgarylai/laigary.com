---
slug: "1870-minimum-speed-to-arrive-on-time"
section: "coding"
title: "1870. Minimum Speed to Arrive on Time"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1761875294
updated_at: 1761876929
published_at: 1761875294
---
[1870\. Minimum Speed to Arrive on Time](https://leetcode.com/problems/minimum-speed-to-arrive-on-time/)

這個題目有幾個要注意的地方

1.  不管速度多快可以抵達一個地方，只要有一個目的地，就至少需要花費一個小時，如果有 `n` 個目的地，就要 `n` 個小時。因此如果目的地數量 `n` 比起 `hour` 還高，那就不可能找得到答案，要回傳 `-1` 。
2.  這裡的速度和所需時間是呈現反比，也就是說，如果我們速度越快，所需要的時間越少，這時候我們應該要是降低速度，反之如果時間花費的太長，代表我們要增長速度。
3.  為何是返回 `low` ？
    1.  迴圈的最後一次的執行，是當 low == high 的時候
    2.  如果 `h <= hour` 那，代表 low or high 都是可行解，這個時候 high 會減少 1 ，low 才有記憶最後的答案。
    3.  那如果 `h > hour` ，那代表 low 跟 high 都差一點是可行解，所以需要把 low 跟 high 都提高一點，而在這個情況下只有 low 會增加 1 ，所以 low 才是可行解。

```python
class Solution:
    def minSpeedOnTime(self, dist: List[int], hour: float) -> int:
        
        if len(dist) > ceil(hour):
            return -1

        def getHours(speed):
            t = 0
            for d in dist:
                t = ceil(t)
                t += d / speed
            return t
        
        low = 1
        high = 10000000 + 1

        while low <= high:
            mid = low + (high - low) // 2
            h = getHours(mid)
            if h <= hour:
                high = mid - 1
            else:
                low = mid + 1
        return low
```