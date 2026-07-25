---
slug: "643-maximum-average-subarray-i"
section: "coding"
title: "643. Maximum Average Subarray I"
status: "published"
pinned: false
tags: ["Array", "Sliding Window"]
created_at: 1709872803
updated_at: 1761092293
published_at: 1709872803
---
[643\. Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/)

題目不難，但是小細節很多，這個題目主要的考點是滑動窗口。

最一開始的想法是每次移動一個 `index` ，並且加總接下來 `k` 個元素，在這個過程中，更新記憶體中的最大值。

```python
class Solution:
    def findMaxAverage(self, nums: List[int], k: int) -> float:
        
        res = float('-inf')
        
        for i in range(len(nums) - k + 1):
            tmp = 0
            for j in range(i, i + k):
                tmp += nums[j]
            res = max(res, tmp)
        
        return res / k
```

這樣的確透過滑動窗口來完成這個題目了，但是此時的時間複雜度是 $O(n * k)$，因為每次更新一個窗口時，需要再遍歷 `k` 個元素，此時我們想要試著看看可不可以優化這個演算法？

每次更新這個窗口的時，其實我們真正變動的地方在於踢除最舊的元素，以及加入新的元素，中間的元素其實是沒有必要變動的。

這時候，可以把時間複雜度將至 $O( n + 2)\approx O(n)$。

```python
class Solution:
    def findMaxAverage(self, nums: List[int], k: int) -> float:
        
        res = float('-inf')
        tmp = 0
        for i in range(k):
            tmp += nums[i]
        res = max(res, tmp)
        
        for i in range(k, len(nums)):
            tmp = tmp - nums[i - k] + nums[i]
            res = max(res, tmp)
        
        return res / k
```

While loop 的做法

```python
class Solution:
    def findMaxAverage(self, nums: List[int], k: int) -> float:
        
        curr = 0
        res = float('-inf')
        slow = 0
        fast = 0
        n = len(nums)
        
        while fast < n:
            curr += nums[fast]
            if fast - slow + 1 > k:
                curr -= nums[slow]
                slow += 1
            if fast - slow + 1 == k:
                res = max(res, curr)
            
            fast += 1
        
        return res/k
```