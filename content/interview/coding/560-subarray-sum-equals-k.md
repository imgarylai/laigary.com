---
slug: "560-subarray-sum-equals-k"
section: "coding"
title: "560. Subarray Sum Equals K"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1674972900
updated_at: 1742785482
published_at: 1674972900
---
[560\. Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/)

## 問題描述

給定一個整數陣列和一個整數 K，求子陣列總和等於 K 的數量。

## 解法一：暴力法（前綴和）

我的第一個思路是使用前綴和技巧。計算每個位置的前綴和後，我們可以透過比較兩個位置之間的前綴和差值是否等於 K，來找出所有符合條件的子陣列。

**關鍵概念**：如果 `prefix_sum[j] - prefix_sum[i] == k`，則表示從索引 i 到 j-1 的子陣列總和等於 K。

需要注意一個邊界情況：如果從陣列開頭就構成一個和為 K 的子陣列，因此我們在前綴和陣列開頭加入 0。

```python
class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        count = 0
        l = len(nums)
        prefix_sum = [0] * (l+1)

        # 計算前綴和
        for i in range(1, l+1):
            prefix_sum[i] = prefix_sum[i - 1] + nums[i - 1]

        # 檢查所有子陣列
        for i in range(l):
            for j in range(i+1, l+1):
                if prefix_sum[j] - prefix_sum[i] == k:
                    count += 1

        return count

```

## 解法二：暴力法（簡化版）

上面的方法可以簡化。我們可以直接在外層迴圈開始時計算子陣列的和，不需要預先計算整個前綴和陣列。理論上時間複雜度與第一種方法相同，但在 LeetCode 可能會導致超時。

```python
class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        count = 0
        l = len(nums)
        
        for i in range(l):
            current_sum = 0
            for j in range(i, l):
                current_sum += nums[j]
                if current_sum == k:
                    count += 1
                    
        return count

```

## 解法三：哈希表優化

這個方法利用哈希表大幅提升效率，時間複雜度降至 $O(n)$。

**核心思想**：

1.  如果當前的前綴和 `prefix_sum == k`，那麼從開頭到當前位置的子陣列和為 K
2.  如果 `prefix_sum - k` 在前面出現過，則存在以當前位置結尾的子陣列和為 K

例如：`[1, 2, 3, -7, 1, 2, 3, -7, 7]`

-   若 K = 7，則有兩種方式組合出和為 7 的子陣列：
    -   `[1, 2, 3, -7, 1, 2, 3, -7, 7]` 中的 `[7]`
    -   `[1, 2, 3, -7, 1, 2, 3, -7, 7]` 中的 `[1, 2, 3, -7, 1, 2, 3, -7, 7]` 中的 `[1, 2, 3, -7, 7]`

然而，第一種實現在邏輯上有點複雜：

```python
class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        count = 0
        h = defaultdict(int)

        # 先計算每個 prefix_sum 的次數
        prefix_sum = 0
        for num in nums:
            prefix_sum += num
            h[prefix_sum] = h[prefix_sum] + 1

        # 再次掃描以計算結果
        prefix_sum = 0
        for num in nums:
            prefix_sum += num
            if prefix_sum == k:
                count += 1
            count += h[prefix_sum - k]
        return count

```

## 解法四：哈希表優化（簡化版）

下面是一個更簡潔的實現，只需一次遍歷：

```python
class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:       
        count = 0
        h = defaultdict(int)
        h[0] = 1  # 重要！處理 prefix_sum 直接等於 k 的情況
        prefix_sum = 0

        for num in nums:
            prefix_sum += num
            
            # 如果 prefix_sum-k 存在於哈希表中，說明存在子陣列和為 k
            count += h[prefix_sum - k]
            
            # 更新哈希表
            h[prefix_sum] += 1

        return count

```

這個解法中的關鍵點是 `h[0] = 1`，它處理了從陣列開頭到當前位置總和恰好為 k 的情況。

## 另一種前綴和實現（修正版）

以下是使用前綴和陣列的另一種實現方式：

```python
class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        n = len(nums)
        count = defaultdict(int)
        count[0] = 1  # 初始化，處理從頭開始的子陣列
        res = 0
        prefix_sum = 0

        for i in range(n):
            prefix_sum += nums[i]
            
            # 檢查是否存在 prefix_sum - k 的前綴和
            res += count[prefix_sum - k]
            
            # 更新哈希表
            count[prefix_sum] += 1
        
        return res

```

這個方法直接在一次遍歷中完成所有操作，效率更高且邏輯更清晰。

總結來說，哈希表方法是這個問題的最優解，時間複雜度為 $O(n)$，空間複雜度也為 $O(n)$。