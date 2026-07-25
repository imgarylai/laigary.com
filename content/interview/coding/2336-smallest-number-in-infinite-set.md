---
slug: "2336-smallest-number-in-infinite-set"
section: "coding"
title: "2336. Smallest Number in Infinite Set"
status: "published"
pinned: false
tags: ["Design", "Hash Table"]
created_at: 1709784141
updated_at: 1709789902
published_at: 1709784141
---
[2336\. Smallest Number in Infinite Set](https://leetcode.com/problems/smallest-number-in-infinite-set/)

這個題目滿有趣的，側重在邏輯處理的部分，寫 code 的難度相對簡單一點。

題目要設計出一個物件，這個物件紀錄著從 1 開始到無窮盡的所有正整數的 set，並且這個物件有兩個方法：

1.  第一個方法：可以從這個 set 中，每次取出最小的正整數出來。
2.  第二個方法：加入一個數字到這個 set 中（也就是要符合 set 的所有特性）

描述這個物件的邏輯很簡單，但是很明顯的這個邏輯有些地方是程式有所侷限的地方，像是就算是現在的記憶體很便宜，我們的空間可以一直擴展，但是也不可能窮舉出所有的正整數。

不過如果只有第一種方法的話，其實這個問題就可以簡化，因為這是一個 set ，所以所有的整數都一定只會出現一次，其實我們只需要一個可以保存數字的記憶體，只要每次取出後就加一，就可以模擬第一個方法的要求，也就是說這樣我們就可以模擬題目所要求的 set 的行為，不必真的窮舉出所有正整數。

但是有了第二個方法後，上面作法就會出現問題了，因為如果我加入的數字比目前計數的數字還小，我就需要跳回去，而且題目可以連續幾個步驟都是操作這個加入數字，此時我就不能馬上跳回去，我需要再度「用完所有加入的數字」才可以回到上面所提的計數的方法。

這個時候，我們就需要思考的是，那我們怎麼樣紀錄加入的數字？這時候加入的數字還會有兩種情況，一種是加入的數字比當前的計數大，或是當前的數字比當前的計數小，為什麼要考慮這兩種情況呢？因為如果加入的數字比當前的數字小會擾亂我們的計數器，但是如果加入的數字比當前的數字大的時候，由於這個題目所要模擬的是 set ，所以代表更大的數字一定沒有沒 pop 出來，加入也是白加的，所以只要考慮比當前的數字還小的數字即可。

但是加入比當前更小的數字時，我們還需要滿足兩個條件

1.  加入的數字是沒有按照大小順序的，所以紀錄的方式最好可以保持其升冪排列的特性。
2.  加入過後的數字，也是要保持 set 的特性，已經加入過的數字可以忽略不計。

這時候上面兩個條件的資料結構就很簡單了，可以分別用 min heap 紀錄第一個條件以及真的使用 set 的地方，紀錄第二個條件。

```python
class SmallestInfiniteSet:

    def __init__(self):
        self.curr = 1
        self.heap = []
        self.addSet = set()

    def popSmallest(self) -> int:
        if len(self.heap) != 0:
            res = heapq.heappop(self.heap)
            self.addSet.remove(res)
        else:
            res = self.curr
            self.curr += 1
        return res
        

    def addBack(self, num: int) -> None:
        if self.curr <= num or num in self.addSet:
            return
        heapq.heappush(self.heap, num)
        self.addSet.add(num)


# Your SmallestInfiniteSet object will be instantiated and called as such:
# obj = SmallestInfiniteSet()
# param_1 = obj.popSmallest()
# obj.addBack(num)
```