---
slug: "480-sliding-window-median"
section: "coding"
title: "480. Sliding Window Median"
status: "published"
pinned: false
tags: ["Heap", "Sliding Window"]
created_at: 1743282828
updated_at: 1743303798
published_at: 1743282828
---
[480\. Sliding Window Median](https://leetcode.com/problems/sliding-window-median/)

這個題目是一個移動窗口以及找尋中位數的題目，難度為 `hard` ，這個題目難的地方在於：

1.  每次移動窗口的時候，我們需要把最舊的元素給剔除，並且加入一個新的元素，這個過程會需要能夠得知每個元素的相對順序。
2.  在每個窗口中，我們需要找到中位數，這個中位數可以是在這個窗口的任意一個位置，而且既然是要找中位數，期待的答案可能就不是考不斷地去排序找出中位數的值。

因此一個條件需要知道順序，一個條件需要知道大小，讓這個題目變得比較難，當然這個題目是存在暴力解的，那就是每次移動一個窗口，就去排序一次，在面試的時候我想不到最優解的情況，應該也會先透過暴力解來實作。

接著我想到這個題目很像是 [295\. Find Median from Data Stream](/interview/coding/295-find-median-from-data-stream) 透過 min heap 跟 max heap 來保持常數時間的取出中位數。

```python
class MedianFinder:

    def __init__(self):
        self.minHeap = []
        self.maxHeap = []
        

    def addNum(self, num: int) -> None:
        # insert
        if len(self.maxHeap) == 0 or num < -1 * self.maxHeap[0]:
            heapq.heappush(self.maxHeap, -1 * num)
        else:
            heapq.heappush(self.minHeap, num)

        # balance
        if len(self.maxHeap) > len(self.minHeap):
            heapq.heappush(self.minHeap, -1 * heapq.heappop(self.maxHeap))
        if len(self.minHeap) > len(self.maxHeap):
            heapq.heappush(self.maxHeap, -1 * heapq.heappop(self.minHeap))
        
    def findMedian(self) -> float:
        if len(self.maxHeap) == len(self.minHeap):
            return (self.minHeap[0] + (-1 * self.maxHeap[0])) / 2
        elif len(self.maxHeap) > len(self.minHeap):
            return -1 * self.maxHeap[0]
        else:
            return self.minHeap[0]

class Solution:
    def medianSlidingWindow(self, nums: List[int], k: int) -> List[float]:
        
        res = []
        for i in range(len(nums) - k + 1):
            medianFinder = MedianFinder()
            for j in range(i, i + k):
                medianFinder.addNum(nums[j])
            res.append(medianFinder.findMedian())
        return res

```

這樣的時間複雜度為 $O(nklogk))$。在 Leetcode 中還是會超時，後面我還是參考了 ChatGPT 的建議，才能想到優化的解法。

一開始我有提到，每次移動窗口的時候，我需要知道哪個元素是最舊的要被丟出去，但是如果在 heap 中，是沒有辦法快速的得知**哪個元素是最舊的？**因此 ChatGPT 的提示是，我們真的需要順序嗎？其實我們如果可以知道是哪個數字需要被丟棄就可以了。

```python
import heapq
from collections import defaultdict
from typing import List

class Solution:
    def medianSlidingWindow(self, nums: List[int], k: int) -> List[float]:
        result = []
        maxHeap = []  # max heap (store negative values)
        minHeap = []  # min heap
        delayed = defaultdict(int)

        def prune(heap):
            while heap:
                num = -heap[0] if heap is maxHeap else heap[0]
                if delayed[num]:
                    heapq.heappop(heap)
                    delayed[num] -= 1
                else:
                    break

        def getMedian():
            if k % 2 == 1:
                return float(-maxHeap[0])
            else:
                return (-maxHeap[0] + minHeap[0]) / 2.0

        # 初始化：插入前 k 個元素，同步平衡
        for i in range(k):
            num = nums[i]
            if not maxHeap or num <= -maxHeap[0]:
                heapq.heappush(maxHeap, -num)
            else:
                heapq.heappush(minHeap, num)

            # 平衡 heap
            if len(maxHeap) > len(minHeap) + 1:
                heapq.heappush(minHeap, -heapq.heappop(maxHeap))
            elif len(minHeap) > len(maxHeap):
                heapq.heappush(maxHeap, -heapq.heappop(minHeap))

        result.append(getMedian())

        # 滑動視窗
        for i in range(k, len(nums)):
            in_num = nums[i]
            out_num = nums[i - k]
            balance = 0

            delayed[out_num] += 1
            if maxHeap and out_num <= -maxHeap[0]:
                balance -= 1
                if out_num == -maxHeap[0]:
                    prune(maxHeap)
            else:
                balance += 1
                if minHeap and out_num == minHeap[0]:
                    prune(minHeap)

            # 插入新數字
            if maxHeap and in_num <= -maxHeap[0]:
                heapq.heappush(maxHeap, -in_num)
                balance += 1
            else:
                heapq.heappush(minHeap, in_num)
                balance -= 1

            # 平衡
            if balance < 0:
                heapq.heappush(maxHeap, -heapq.heappop(minHeap))
                prune(minHeap)
            elif balance > 0:
                heapq.heappush(minHeap, -heapq.heappop(maxHeap))
                prune(maxHeap)

            result.append(getMedian())

        return result
```

`prune` 這個函式，是解這題 Sliding Window Median 的**關鍵技術之一**，尤其是在我們無法從 heap 中**直接刪除任意元素**的情況下。

* * *

## 🧠 簡單來說：

> **`prune` 就是「清掉 heap 頂部那些應該被刪除但還沒被 pop 掉的數字」。**

* * *

## 🔍 為什麼需要 prune？

Python 的 `heapq` 是個最小堆（min-heap）實作，但它 **不能直接刪除 heap 中間的元素**，只能從頂部 `heappop()`。

### 👇 假設這是你的 heap：

```python
minHeap = [1, 3, 5, 7, 9]

```

你想從中刪掉 `3`，但它不在頂端，所以 Python `heapq` 沒有辦法直接幫你做這件事。

* * *

## ✅ 解法：延遲刪除（lazy deletion）

我們不馬上從 heap 中刪除 `3`，而是記錄說：

> 「`3` 這個數字之後要刪掉，如果它剛好浮到頂端的話，就真的刪！」

這就是我們的 `delayed` 字典的作用：

```python
delayed[3] = 1  # 表示數字 3 要被刪除一次

```

* * *

## ✅ `prune(heap)` 做的事

```python
def prune(heap):
    while heap:
        num = -heap[0] if heap is maxHeap else heap[0]
        if delayed[num]:
            heapq.heappop(heap)       # 把頂部拿掉
            delayed[num] -= 1         # 減少刪除次數
        else:
            break  # 頂端沒標記刪除，就不再 pop

```

### 🌟 這段邏輯等於：

-   不斷檢查 heap 的頂端是不是要被刪除的數字
-   如果是，就 `heappop()` 掉它
-   如果不是，就結束 `prune`

* * *

## 📌 `prune` 常常用在哪裡？

場景

需要 prune？

從 heap 中 pop 前，確保頂端是有效數字

✅

在計算中位數時，保證 heap\[0\] 是正確的

✅

在 `balance()` 後，heap 頂端可能是過期的

✅

* * *

## ✅ 沒有 prune 會怎樣？

你可能會：

-   取到應該已經被移出視窗的數字作為中位數 ❌
-   heap 大小看起來對，但其實裡面有垃圾 ❌
-   在 balance 過程中錯移元素 ❌

* * *

## 🎯 結論

`prune` 是一種：

> 「**在必要時清除 heap 頂部失效元素**」的技巧，  
> 讓我們可以模擬出**支援刪除任意元素的堆**，  
> 而實際只用到了 Python 內建的 `heapq`！

這就是它的意義與強大之處 🚀