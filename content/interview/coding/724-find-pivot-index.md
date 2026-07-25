---
slug: "724-find-pivot-index"
section: "coding"
title: "724. Find Pivot Index"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1684729594
updated_at: 1684732520
published_at: 1684729594
---
[724\. Find Pivot Index](https://leetcode.com/problems/find-pivot-index/description/)

這一題的目標是我們要找到在陣列中的一個索引，這個索引左側的所有數字的總和相等於右側的所有數字總和，索引的位置可能在這個陣列中的任何一個地方，取決於左側和右側每個數字的大小以及其分佈。

這一題比較直觀的想法是，那我先計算出這個陣列從左到右的累加總和，再計算出這個陣列從右到左的累加總和，這兩個陣列中如果有同一個位置剛好數字一樣，那就是我們要找的索引。

題目給的範例：

```text
nums = [1,7,3,6,5,6]
accumulate_sum_from_left = [ 1, 8,11,17,22,28]
accumulate_sum_from_right = [28,27,20,17,11, 6]
```

如果我們先計算出上面兩個數值，就可以很快地找到位置是在 3 。下面是程式的實作：

```python
class Solution:
    def pivotIndex(self, nums: List[int]) -> int:
        accumulate_sum_from_left = []
        accumulate_sum_from_right = []
        
        for index, num in enumerate(nums):
            if index == 0:
                accumulate_sum_from_left.append(num)
            else:
                accumulate_sum_from_left.append(num + accumulate_sum_from_left[-1])
                
        for index, num in enumerate(reversed(nums)):
            if index == 0:
                accumulate_sum_from_right.append(num)
            else:
                accumulate_sum_from_right.append(num + accumulate_sum_from_right[-1])        
        
        accumulate_sum_from_right.reverse()
        
        i = 0
        while i < len(nums):
            if accumulate_sum_from_left[i] == accumulate_sum_from_right[i]:
                return i
            i += 1
            
        return -1
```

上面的方法時間複雜度依然是 $O(n)$ ，而且需要兩個陣列來儲存這些累加值，記憶體所需要的空間複雜度是 $O(n)$。

時間複雜度來看，不管怎麼樣都至少一定要遍歷一次陣列，時間複雜度已經達到最佳的情況。可是空間複雜度上來說，是可以思考是不是有可以優化的地方。

可以從上面的答案來觀察一下有沒有更優的記憶體使用方法。

第一個可以觀察到的是不管從左側累加或是右側累加，最後總和一定都會是相等的，那如果我們觀察在最後找到位置時，我們是不是可以把右側累加的表達方式，用我們其他已知的數字來做替換呢？

$$
\sum_{i=k+1}^n nums[i] = \sum_{i=0}^n nums[i] -  nums[k] - \sum_{i=0}^{k-1} nums[i]
$$

如此以來我們要找到的目標就可以變成：在索引 $k$ 左側累計的累加數值相等於所有數值的總和減去索引 $k$ 位置的數值再減去左側累計的累加數值。

$$
\sum_{i=0}^{k-1} nums[i] == \sum_{i=0}^n nums[i] - nums[k] - \sum_{i=0}^{k-1} nums[i]
$$

```python
class Solution:
    def pivotIndex(self, nums: List[int]) -> int:
        total = sum(nums)
        left_sum = 0
        
        for i, num in enumerate(nums):
            if left_sum == (total - left_sum - num):
                return i
            left_sum += num
        
        return -1
```

以上的方法就可以使用到 $O(1)$ 的記憶體空間來完成。