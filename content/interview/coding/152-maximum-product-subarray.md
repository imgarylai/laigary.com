---
slug: "152-maximum-product-subarray"
section: "coding"
title: "152. Maximum Product Subarray"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674964326
updated_at: 1674964500
published_at: 1674964326
---
[152\. Maximum Product Subarray](https://leetcode.com/problems/maximum-product-subarray/)

這個題目算是一個比較困難一點的動態規劃題目，首先我們先了解題目，題目要求的是找的是一個子陣列，這個子陣列每個元素的積會比其他子陣列所求的積裡面還大，並求其積為多少。

題目給定的陣列沒有排序、數字的範圍從 `[-10, 10]` ，所以零也包含在內了，這就代表的是有幾種情況：

1.  兩個非常小的負數相乘後，可以變成一的很大的正數
2.  一個很大的正數，在乘上零之後就變得沒有意義了
3.  一個很大的正數，在乘上一個負數之後，就會變成一個很小的數，但是也有可能利用一，變成一個很大的數。

## 暴力解

這個方法並不會太難，時間複雜度 $O(n^{2})$。

```python
class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        if len(nums) == 0:
            return 0

        result = nums[0]

        for i in range(len(nums)):
            accu = 1
            for j in range(i, len(nums)):
                accu *= nums[j]
                result = max(result, accu)

        return result
```

## 動態規劃

這個動態規劃就有點難了，我一開始想要用自頂向下的方式來寫，但是因為會有正負數的轉換，這樣會讓自頂向下的方式很難寫，於是就朝著自底向上的方式來做。

即使是自底向上，一樣要處理正負數跳來跳去的問題，這一題有一個

```python
class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        
        n = len(nums)
        
        mindp = nums[0]
        maxdp = nums[0]
        res = nums[0]
        
        for i in range(1, len(nums)):
            num = nums[i]
            currMin = min(num, mindp*num, maxdp*num)
            currMax = max(num, mindp*num, maxdp*num)
            mindp = currMin
            maxdp = currMax
            res = max(maxdp, res)
        
        return res
```

精簡版，可讀性較差

```python
class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        
        n = len(nums)
        
        mindp = nums[0]
        maxdp = nums[0]
        res = nums[0]
        
        for i in range(1, len(nums)):
            num = nums[i]
            mindp, maxdp = min(num, mindp*num, maxdp*num), max(num, mindp*num, maxdp*num)
            res = max(maxdp, res)
        
        return res
```