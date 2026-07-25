---
slug: "69-sqrt-x"
section: "coding"
title: "69. Sqrt(x)"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674943931
updated_at: 1720325955
published_at: 1674943931
---
[69\. Sqrt(x)](https://leetcode.com/problems/sqrtx/)

題目是要找出給定一個數字的平方根，如果沒有整數的平方根時，給出最接近的整數後，捨去所有的小數位（不用四捨五入）

題目存在著很簡單的解法，那就是從數字 1 開始，依序增加，每個數字都去計算出平方數，看是否等於題目給定的 `x` （或最接近）即可，這個方法的時間複雜度是線性的 $O(n)$。

但是這個題目存在著一個更快的方法，需要複習一點高中數學，那就是平方根一定小於或等於自身數字的一半，因此這樣就可以減去一半的搜尋空間。

接下來，搜尋的空間減少了一半，但是我們並不需要一個一個找，我們應該從這一半的集合中的中位數去找，當中位數的平方大於目標，那就代表平方根的答案會比中位數小，反之亦然，這個重複搜尋的邏輯，就可以轉換成二分搜索的方式，來找到答案。

```python
class Solution:
    def mySqrt(self, x: int) -> int:        
        if x == 1:
            return 1
        left = 1
        right = x // 2
        while left <= right:
            mid = left + (right - left) // 2
            num = mid * mid
            if num == x:
                return mid
            elif num < x:
                left = mid + 1
            elif num > x:
                right = mid - 1
        return right
```