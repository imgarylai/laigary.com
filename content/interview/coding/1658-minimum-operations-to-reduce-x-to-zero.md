---
slug: "1658-minimum-operations-to-reduce-x-to-zero"
section: "coding"
title: "1658. Minimum Operations to Reduce X to Zero"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1723425790
updated_at: 1742778030
published_at: 1723425790
---
[1658\. Minimum Operations to Reduce X to Zero](https://leetcode.com/problems/minimum-operations-to-reduce-x-to-zero/)

給定一個數組 `nums` 和一個整數 `x`，你可以從數組的「**開頭或結尾**」移除元素，使得被移除元素的總和等於 `x`。請返回最少的移除次數。如果無法做到，返回 `-1`。

### **關鍵思路**

因為可以從**頭部或尾部**移除元素，暴力嘗試所有可能的移除方式會導致 **指數級** 的時間複雜度，無法高效解決。我們可以 **轉換問題**，從「**刪除最少元素**」變成「**找到最長的中間連續子陣列**」，讓這部分的總和等於 `total - x`。

```python
class Solution:
    def minOperations(self, nums: List[int], x: int) -> int:
        n = len(nums)
        total = sum(nums)
        target = total - x

        left = 0
        right = 0

        window = 0
        l = float('-inf')

        while right < n:
            window += nums[right]
            right += 1

            while window > target and left < right:
                window -= nums[left]
                left += 1
            
            if window == target:
                l = max(l, right - left)
            
        return -1 if l == float('-inf') else n - l
```

* * *

## **為什麼要這樣轉換？**

題目要求 **刪除最少的數，使剩下的數總和為 `total - x`**。如果我們直接考慮如何刪除前後的元素，這會變成一個較難解的問題，因為刪除的方式很多。

所以我們可以 **換個角度**：

-   **與其考慮刪除哪些數，不如考慮保留哪些數。**
-   如果我們能找到一個總和為 `total - x` 的**最長連續子陣列**，那麼只要保留這些數，剩下的數就需要刪除。
-   因此，刪除的最少元素數量就是 `n - (這個子陣列的長度)`。

* * *

## **具體步驟**

1.  **計算總和** `total = sum(nums)`
2.  **計算目標和** `target = total - x`
    -   這是我們希望找到的**最長子陣列的總和**
3.  **使用滑動窗口找出總和為 `target` 的最長子陣列**
    -   用 **雙指針（左右指針）** 來維護一個窗口
    -   當窗口內的數字總和超過 `target`，就移動 `left` 指針縮小窗口
    -   如果剛好等於 `target`，就更新子陣列的最大長度
4.  **如果找到符合條件的子陣列，答案就是 `n - (子陣列長度)`，否則返回 `-1`**

* * *

## **舉例分析**

### **範例 1**

```python
nums = [3,2,20,1,1,3]
x = 10

```

-   計算 `total = 3 + 2 + 20 + 1 + 1 + 3 = 30`
-   計算 `target = total - x = 30 - 10 = 20`
-   **找總和為 `20` 的最長子陣列**：
    -   `[20]`（長度 1）
-   答案為 `n - 1 = 6 - 1 = 5`

* * *

### **範例 2**

```python
nums = [1,1,4,2,3]
x = 5

```

-   計算 `total = 1 + 1 + 4 + 2 + 3 = 11`
-   計算 `target = 11 - 5 = 6`
-   **找總和為 `6` 的最長子陣列**：
    -   `[4,2]`（長度 2）
-   答案為 `n - 2 = 5 - 2 = 3`

* * *

## **總結**

-   `total` 是為了計算 `target = total - x`
-   問題轉化為 **找最長的連續子陣列，其總和等於 `target`**
-   用 **滑動窗口（雙指針）** 來解
-   若找到該子陣列，答案是 `n - (子陣列長度)`
-   若找不到，回傳 `-1`

這樣的解法是 $O(n)$，比起暴力解法更高效 🚀