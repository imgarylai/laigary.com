---
slug: "977-squares-of-a-sorted-array"
section: "coding"
title: "977. Squares of a Sorted Array"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972891
updated_at: 1685507489
published_at: 1674972891
---
[997\. Squares of a Sorted Array](https://leetcode.com/problems/squares-of-a-sorted-array/)

這一個題目的問題是給定一個排序好的陣列，計算出所有數字的次方後，再依序由小排到大。

給定的排序好的陣列看似很貼心，但是實際上這就是此題目的陷阱，因為雖然是排序好，但是如果原先陣列裡面最小的幾個數字都是負數，平方後會變成正數，那原本最小的數字，可能變成最大的數字，原先是正數比較大的數字，平方後反而比較小，題目的關鍵核心如果沒有辦法想到的話的確就很難寫出最佳解。

我們先看看直覺的解法，那當然就是全部的數字算好次方數後再排序，這個方法的時間複雜度即為 $O(nlog_(n))$，其實並不算是非常差，但是被問到的最佳解其實是存在著 $O(n)$ 的線性解法的，只是需要用一點心思去觀察。

我們來重新觀察題目，題目的陣列有排序好，陣列兩端的數字，會因為平方後從小的變成更大的，也可能從原先的最大數字變成最小的數字，在知道這個規律後，其實我們可以換個角度看，那就是越往陣列的中心前進，其變化的幅度會越小。也就是說，可以推論所有數字的最小值一定是存在於從「兩側」往中間前進的位置。

這個部分更接近題目的核心，那就是如果我們先找出最大的數字依序排列，那只要把數列反過來，就可以回答題目的答案，將所有數字平方後依序從最小到最大來排列。

這個題目就會變成一個雙指針的題目：

```python
class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        left = 0
        right = len(nums) - 1
        res = []
        while left <= right:
            if abs(nums[left]) > abs(nums[right]):
                res.append(nums[left] ** 2)
                left += 1
            else:
                res.append(nums[right] ** 2)
                right -= 1

        return res[::-1]

```