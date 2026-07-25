---
slug: "1109-corporate-flight-bookings"
section: "coding"
title: "1109. Corporate Flight Bookings"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674948880
updated_at: 1674948968
published_at: 1674948880
---
[1109\. Corporate Flight Bookings](https://leetcode.com/problems/corporate-flight-bookings/)

直覺的做法，直接把所有的情況窮舉，再存入到到一個矩陣，接下來就只要對矩陣做每行的總合就可以。

```python
class Solution:
    def corpFlightBookings(self, bookings: List[List[int]], n: int) -> List[int]:
        cols = n
        rows = len(bookings)
        matrix = [[0]*cols for _ in range(rows)]
        for row in range(len(bookings)):
            start, end, reserved = bookings[row]
            for i in range(start1-1, end):
                matrix[row][i] = reserved
        ans = []

        for col in range(cols):
            tmp = 0
            for row in range(rows):
               tmp += matrix[row][col] 
            ans.append(tmp)
        return ans
```

這個情況很明顯應該會超時（事實也是超時），而且需要的矩陣數量會非常大，這個矩陣在很多情況其實也只會有一堆零。

這題優化的技巧其實滿特別的，我想了半天還是想不到。直接看最終的程式碼也有點難懂，解法其實直接看程式碼也很難懂，我會先放上解法再解釋。

```python
class Solution:
    def corpFlightBookings(self, bookings: List[List[int]], n: int) -> List[int]:
        ans = [0] * (n + 1)
        for booking in bookings:
            first, last, seats = booking
            ans[first - 1] += seats
            ans[last] -= seats

        for i in range(1, n):
            ans[i] += ans[i-1]
        ans.pop()
        return ans
```

看完後應該會有幾個疑問？

1.  為什麼要 n+1 而不是 n 的空間？
2.  為什麼只有兩個點紀錄，還一個用加的，一個用減的？

我覺得 [LeetCode 討論區](https://leetcode.com/problems/corporate-flight-bookings/discuss/328856/JavaC++Python-Sweep-Line/303095)有個人解釋的很好，想像以下情況：

```text
bookings: [[1,10, 100]] , n = 15
# (initially) 
# index:  [  0,1,2,3,4,5,6,7,8,9,  10,11,12,13,14,15] 
# result: [  0,0,0,0,0,0,0,0,0,0,   0, 0, 0, 0, 0, 0]  ------> result is of size n+1, indexed from 0 to 15
# (after loop iteration) 
# result: [100,0,0,0,0,0,0,0,0,0,-100, 0, 0, 0, 0, 0]
```

我們如果先記錄這樣的情況的話，在最後一段做總和計算的時候，就會讓答案變成這樣：

```text
# index:  [  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,10,11,12,13,14,15] 
# result: [100,100,100,100,100,100,100,100,100,100, 0, 0, 0, 0, 0, 0]
```

看懂這個邏輯後，這個題目就比較好懂了。