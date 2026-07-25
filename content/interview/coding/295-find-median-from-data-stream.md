---
slug: "295-find-median-from-data-stream"
section: "coding"
title: "295. Find Median from Data Stream"
status: "published"
pinned: false
tags: ["Classic", "Design", "Heap"]
created_at: 1674973111
updated_at: 1704054910
published_at: 1674973111
---
[295\. Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/)

這題如果透過排序的話，就會很好做，在每次取出數值時，將記憶體中的每個數字排列好，就能夠找到中位數。但是如果透過排序的話，每次取值的時間複雜度就會是 $O(nlogn)$。

這個題目存在著更進階的解法，可以讓每次取值時的時間複雜度為常數時間，但是並不好想到。

解題的思路是這樣的：目標是要找到中位數，由於一般想到中位數時，都會需要透過排列來找到中位數，所以會有前面的解題方法，但是其實事實上我們真的並不用真的完全保持所有數據在完全排序的情況，舉一個極端一點的例子：

```text
[1, 2, 1, 100, 999, 987, 1000]
```

像是上面的例子，雖然陣列沒有完全排序但是其實只要知道中位數兩側的數字，左側的數字始終比他小，另一側的數字始終比他大，這樣的情況我們就知道 `100` 會是中位數。

而資料結構中，只在乎極值（最大/最小值），但不在乎排序的方法就是透過 `Heap` 來實作了，利用 `Heap` 的特性，只要我們可以讓「最大」或是「最小」的數字始終保持在樹的最上方。

也就是如果左側的所有數字變成一個 max heap ，右側的數字變成一個 min heap ，這樣中位數就會一直保持在為跟節點的位置。

如果把 max heap 和 min heap 視作兩棵樹， 並且我們先用左樹、右樹代表 max heap 和 min heap

1.  當左樹的節點數目比右側的節點數目多一個，那此時左樹的根節點就是中位數，此時總共的數字有 `n + n + 1` (2n+1) 個節點，為奇數個節點，因此左樹的根節點就是中位數。這個例子把左樹跟右樹交換也同理。
2.  呈上，如果兩棵樹的節點數目一樣，那此時總共就有 `2n` 個節點，此時中位數就會是左樹跟右樹的節點的平均數。

上面的討論並沒有討論到兩棵樹的節點數目超過 1 的情況，這是因為如果要保持著根節點提供中位數的資訊，我們就要保持著左樹的數目跟右樹的數目有著「平衡狀態」。

平衡的狀態要如何保持呢？

1.  決定要先插入左側或是右側的樹
    1.  如果左側樹為空，或是數字小於左樹的根節點，插入左樹
    2.  反之，數字大於左樹的根節點，插入右樹
2.  檢查左樹的數量是否大於右樹
    1.  如果右樹數量大於左樹，pop 根節點出來，重新插入到右樹
    2.  （即使左樹的根節點被丟到了右樹，也只會是右樹的根節點）
3.  檢查右樹的數量是否大於左樹
    1.  如果左樹數量大於右樹，pop 根節點，重新插入到左樹
    2.  （即使右樹的根節點被丟到了左樹，也只會是左樹的根節點）
4.  如果兩側數量相同，樹已經處於「平衡」狀態。

以上的情況有幾種情況，最好的方式其實就是用紙筆去把幾種情況畫出來，就會發現樹可以一直平衡。

時間複雜度在插入數字的時候可以保持在 $O(logn)$，再取出中位數的時候就可以以常數時間取出。

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


# Your MedianFinder object will be instantiated and called as such:
# obj = MedianFinder()
# obj.addNum(num)
# param_2 = obj.findMedian()
```