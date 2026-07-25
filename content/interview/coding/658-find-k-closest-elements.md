---
slug: "658-find-k-closest-elements"
section: "coding"
title: "658. Find K Closest Elements"
status: "published"
pinned: false
tags: ["Array", "Binary Search", "Heap"]
created_at: 1711755793
updated_at: 1766977675
published_at: 1711755793
---
[658\. Find K Closest Elements](https://leetcode.com/problems/find-k-closest-elements/)

這個題目是給定一個點 `x`，要找出最接近的 `k` 個點，題目還有給另外一個條件，那就是如果有兩點距離相同的時候，要比較兩點的值，我們要取值小的座標。

乍看其實有點像是要使用 Heap 來實作，Heap 也的確可以實作。

```python
class Solution:
    def findClosestElements(self, arr: List[int], k: int, target: int) -> List[int]:
        heap = []

        for num in arr:
            d = abs(target - num)
            if len(heap) < k:
                heapq.heappush(heap, (-d, -num))
            else:
                heapq.heappushpop(heap, (-d, -num))
        
        res = []

        while heap:
            d, num = heapq.heappop(heap)
            res.append(-num)
        
        res.sort()
        return res
```

要注意的是，題目要求的答案很嚴格，如果說有兩個點距離 target 相同時，要選數字較小的那個，在 python 的實作時，同時對 num 取負值就可以了。

* * *

通常使用 heap 來實作的題目，給定的陣列並不會排列好，因為我們就是需要 heap 來獲得 `k` 個最大值而不去真的排序，既然題目已經排序好了，就應該要善用這個值。

既然是排列好的情況，其實就可以知道最後的答案究竟是怎麼樣選擇的，例如：題目給定的值，比起陣列中所有的值都還小，那一定是陣列中最前面的幾個值最接近 `x` ，如果 `x` 比所有的數值都還大，那一定是選陣列最後的幾個，只有如果 `x` 的值剛好在陣列的最大最小值中間時需要考慮。

觀察出這樣的現象後，其實就可以繼續實作這個題目的要求，透過 binary search 的方式，來找到題目所求的區間。

```python
class Solution:
    def findClosestElements(self, arr: List[int], k: int, x: int) -> List[int]:
        
        # Your code goes here
        left = 0
        right = len(arr) - 1
        
        while right - left + 1 > k:
            if abs(arr[left] - x) > abs(arr[right] - x):
                left += 1
            else:
                right -= 1
        
        return arr[left:left+k]
```