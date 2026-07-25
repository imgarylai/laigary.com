---
slug: "2270-number-of-ways-to-split-array"
section: "coding"
title: "2270. Number of Ways to Split Array"
status: "published"
pinned: false
tags: ["Prefix Sum"]
created_at: 1742771839
updated_at: 1742772528
published_at: 1742771839
---
[2270\. Number of Ways to Split Array](https://leetcode.com/problems/number-of-ways-to-split-array/)

此道題目需要先理解 Prefix Sum 的概念比較好做，如果可以理解的話這個題目只有一個地方比較難，那就是為什麼在把題目陣列分左右兩側的邏輯中，for 迴圈需要在最後減一？

```python
class Solution:
    def waysToSplitArray(self, nums: List[int]) -> int:
        
        prefix = [nums[0]]

        for i in range(1, len(nums)):
            prefix.append(prefix[len(prefix) - 1] + nums[i])
        
        valid = 0

        for i in range(len(prefix) - 1):
            front = prefix[i]
            end = prefix[len(prefix) - 1] - prefix[i]
            if front >= end:
                valid += 1
        
        return valid
```

這裡的 `- 1` 是為了 **避免最後一個元素成為前半部分的結尾**，從而確保陣列被正確地拆分為兩個部分。

這道題的目標是找出能夠將 `nums` 陣列分成兩部分 `(nums[0:i], nums[i:])`，並且滿足：

$$
\text{前半部分的總和} \geq \text{後半部分的總和}
$$

根據程式碼，`prefix[i]` 代表前 `i+1` 個元素的總和，而 `end = prefix[len(prefix) - 1] - prefix[i]` 代表後半部分的總和。

### **為何 `range(len(prefix) - 1)`?**

`prefix` 的長度與 `nums` 相同，而有效的切割點最多只能到**倒數第二個位置**，不能到最後一個位置。例如：

`nums = [2, 3, 1, 5]` 對應的 `prefix` 陣列：`prefix = [2, 5, 6, 11]`

**可能的切割點 (`i` 的範圍)**：

```text
i = 0: front = 2, end = 9
i = 1: front = 5, end = 6
i = 2: front = 6, end = 5  (符合條件)
```

此時 `i` 只能取 `0 ~ len(prefix) - 2`，即 `range(len(prefix) - 1)`。

如果 `i == len(prefix) - 1`，那麼：

-   `front = prefix[len(prefix) - 1]`（即整個陣列的總和）
-   `end = prefix[len(prefix) - 1] - prefix[len(prefix) - 1] = 0`  
    → **這樣會導致沒有後半部分，違反題目要求**。

### 優化

在這個題目中，其實有一項一直是常數，那就是在計算 `end` 時，我們都是取 prefix sum 的最後一個數字，也就是說如果我們能知道全部數字的總和，在左側累加的同時，只要透過總和減去左側數字的總和，就能知道右側數字的總和，進而優化我們的演算法。

```python
class Solution:
    def waysToSplitArray(self, nums: List[int]) -> int:
        left = 0
        total = sum(nums)

        valid = 0

        for i in range(len(nums)-1):
            left += nums[i]
            right = total - left
            if left >= right:
                valid += 1
        
        return valid
```