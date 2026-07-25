---
slug: "215-kth-largest-element-in-an-array"
section: "coding"
title: "215. Kth Largest Element in an Array"
status: "published"
pinned: false
tags: ["Array", "Heap", "Sorting"]
created_at: 1703655443
updated_at: 1766565304
published_at: 1703655443
---
[215\. Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/)

如果是要找第 `k` 個最大/最小值，最常見的資料結構就是透過 [Heap](/interview/coding?tag=Heap) 來實作，這個題目面試滿常考的，題目非常簡單，但是細節需要注意

我的第一個直覺是先把所有的元素都放進去 Heap ，接著在一個個 pop 出來就好，在 python 中，因為 heap 預設的資料結構是 min heap ，如果要找第 `k` 大的值，要記得加負號。這樣的做法在 LeetCode 上是沒有超時的，但是其實這樣做有個問題，那就是 heap 的插入其實就是在 $O(log(n))$ 的時間複雜度，在我遍歷完所有的數字並且插入 heap 時，總共的時間複雜度已經來到了 $O(nlog(n))$。面試的時候，可能會被要求給出 $O(nlog(k))$ 的答案。

```python
class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        
        heap = []
        for num in nums:
            heap.append(num * -1)
        
        heapq.heapify(heap)
        
        r = heap[0]
        while k > 0:
            r = heapq.heappop(heap)
            k -= 1
        
        return r * -1
```

遍歷的過程是不可能可以改變的，差距就差在 heap 插入的結構是什麼？如果我們可以保持 Heap 始終在 `k` 個元素的情況下，我們就能夠把時間複雜度降低至 $O(nlog(k))$。

因為我們其實只在乎的是第 k 大的值，所以第 k + 1 大...等到最小值，其實我們並不需要保留在記憶體當中，我們只需要保持「前 `k` 大」的值就好，這時候我們就可以繼續使用 min-heap ，因為 min-heap 每次都會把最小值給 pop 掉，也就是如果數字太大，將會在最後一個才 pop 掉。

所以當 heap 的結構的長度超過 `k` 的時候我們就把最小的值給 pop 掉。

```python
class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        heap = []
        for num in nums:
            heapq.heappush(heap, num)
            if len(heap) > k:
                heapq.heappop(heap)
        
        return heap[0] 
```

這裡有個點要注意，那就是為什麼是回傳 `heap[0]`?

在 Python 的 `heapq` 模組中，`heap[0]` 永遠是整個 Heap 的**最小值**。

會選擇 `return heap[0]` 而不是 `heap[-1]`，主要有兩個關鍵原因：

### Heap 的物理結構

Heap（堆積）在底層是用 **Array（列表）** 儲存的，但它代表的是一棵 **Binary Tree（二元樹）**。

-   **`heap[0]`**：是樹的根節點（Root），在 Min-Heap 中，這裡保證存放的是**全 Heap 最小的數字**。
-   **`heap[-1]`**：只是列表的最後一個元素，它在二元樹中是「最後一層的最右側葉子節點」。它雖然很大，但**並不保證**是全 Heap 最大的數字。

> **注意：** Heap 只保證「父節點比子節點小」，並不保證整個列表是從大到小或從小到大排序的。因此 `heap[-1]` 拿到的數字通常沒什麼特殊意義。

也因次這樣邊加入邊 pop 的方式，可以保證速度在 $O(nlog(k))$。