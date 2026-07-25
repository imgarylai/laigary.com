---
slug: "238-product-of-array-except-self"
section: "coding"
title: "238. Product of Array Except Self"
status: "published"
pinned: false
tags: ["Array", "Prefix Sum"]
created_at: 1674843155
updated_at: 1724005659
published_at: 1674843155
---
[238\. Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/)

題目給定一個陣列含有多個整數，要問得出除了自身之外，其他整數的乘積，這個問題可以很輕鬆的透過窮舉的方式來求出答案，其時間複雜度為 $O(n^2) $，但是這個時間複雜度是不是存在著優化的空間？

首先先觀察窮舉的過程，時間複雜度為 $O(n^2) $ 是因為每個元素都需要和其他元素相乘一次，即使做了一點優化，記憶在此之前的所有乘積也還是需要遍歷兩次。

但是如果說這個題目可以順向的遍歷一次，在逆向的遍歷一次，這個時候再進行一次遍歷，就可以得到題目所求。

```python
class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        length = len(nums)

        prefixProduct = [0] * length
        suffixProduct = [0] * length

        ans = [0] * length

        prefixProduct[0] = 1
        for i in range(1, length):
            prefixProduct[i] = prefixProduct[i - 1] * nums[i - 1]

        suffixProduct[length - 1] = 1
        for i in reversed(range(length-1)):
            suffixProduct[i] = suffixProduct[i + 1] * nums[i + 1]

        for i in range(length):
            ans[i] = prefixProduct[i] * suffixProduct[i]

        return ans
```