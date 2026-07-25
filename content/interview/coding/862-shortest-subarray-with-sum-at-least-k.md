---
slug: "862-shortest-subarray-with-sum-at-least-k"
section: "coding"
title: "862. Shortest Subarray with Sum at Least K"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1674972898
updated_at: 1710738487
published_at: 1674972898
---
[862\. Shortest Subarray with Sum at Least K](https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/)

這個題目其實很近似於雙指針的問題，我在看完題目後的第一個想法是，既然要找一個 subarray 總和最少大於 `K` 那一個快指針每次往前不斷加入新的元素，當累計的元素大於 `K` 的時候，開始移動後面的慢指針，並把試著把先前的元素的值減去，以及確保 subarray 的總和大於 `K` 即可。

大概的邏輯如下：

```python
class Solution:
    def shortestSubarray(self, nums: List[int], k: int) -> int:
        

        slow = 0
        fast = 0
        res = float('inf')
        sum = 0
        while fast < len(nums):
            sum += nums[fast]
            fast += 1
            if sum >= k:
                res = min(res, fast - slow)
                while sum - nums[slow] >= k:
                    sum -= nums[slow]
                    slow += 1
                res = min(res, fast - slow)

        return -1 if res == float('inf') else res
```

但是這樣是錯誤的答案，因為上述思考的方式，忽略的一個點是雖然慢指針會往快指針的地方逼近，但是這個逼近並沒有到慢指針往快指針的方向前進時，其實可以接受快慢指針的總和值暫時小於 `K` 的。

例如：

```text
nums = [100, -100, 1, 101]
k = 102
```

當快指針移動到最後一個位置的時候，剛好總和會是 `102` ，此時在檢查慢指針的收縮時是會有錯誤的，因為當總和減去第一個的數字的時候，總和會變成 `2` 還遠遠的小於 `K` ，直到再次檢查「加回」第二個數字 `-100` 後，總和才會變成 `102` ，這時候也會是題目所求的答案長度為 `2` 的 subarray 。

這樣也會變成，慢指針的作用形同虛設，接近暴力法求出最佳解。（It isn't a bad idea tho!)