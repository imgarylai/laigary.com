---
slug: "189-rotate-array"
section: "coding"
title: "189. Rotate Array"
status: "published"
pinned: false
tags: ["Array"]
created_at: 1686727431
updated_at: 1712632714
published_at: 1686727431
---
[189\. Rotate Array](https://leetcode.com/problems/rotate-array/)

直觀的做法是按照題目所敘述的方式，每次把最後的數字放到最前面，在把剩餘的數字慢慢向後移。

假設有 `n` 個元素，有 `k` 個元素需要向右旋轉，最簡單的方式其實是額外建立一個記憶體，然後把前 `n - k` 個元素記錄在一個記憶體，把後面 `k` 個元素記錄在記憶體，重新建立好一個陣列就好，但是題目希望是透過記憶體操作來解決這個問題。

這是有一個比較直覺的做法，那就是我先把最後一個數字先搬到最前面，接著再把所有的數字往後面搬一格，如此一來，我只要搬 k 次，就可以完成題目的要求，其中題目給定的 k 是可以很大的，但是不管 k 有多大，其實我們只在乎 k 除以 nums 的長度後的餘數為多少，因為能夠整除的話，代表 k 和 nums 的長度是一樣，也就是一個數字都不用搬。

```python
class Solution:
    def rotate(self, nums: List[int], k: int) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """

        n = len(nums)
        k %= n

        for i in range(k):
            prev = nums[-1]
            for j in range(n):
                nums[j], prev = prev, nums[j]
```

這個做法的時間複雜度為 $O(nk)$，k 可以無限接近 n ，例如 k = n - 1 的時候，時間複雜度就會接近 $O(n^2)$，這在 LeetCode 上會超時，其實這個方法在面試上要講的清楚也不容易，主要是要怎麼清楚地把 prev 這個變數的狀態描述好是比較容易混淆的，最好的方式是透過一個例子，清楚地和面試官表達自己的想法。

當然此題存在一個最佳解，但是這是屬於要多觀察才容易想得到的答案，邏輯很簡單

1.  先將所有的數字逆序排列，此時我們已經可以把 k index 前的所有值全部都往後移了，只是排列的順序不是正確的。
2.  接著把 index 屬於前 k - 1 個的數字再重新逆序排列一次，此時就變回和題目一樣的順序排列。
3.  再接著把 k index 後的所有數字再重新逆序排列一次，此時就變回和題目一樣的順序排列。

題目要實作的是，是否可以指定 index 的區間進行逆序排列。

```python
class Solution:
    def rotate(self, nums: List[int], k: int) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        
        def reverse(nums, start, end):
            while start < end:
                nums[start], nums[end] = nums[end], nums[start]
                start += 1
                end -= 1
        
        n = len(nums)
        k %= n
        
        reverse(nums, 0, n - 1)
        reverse(nums, 0, k - 1)
        reverse(nums, k, n - 1)
        
```