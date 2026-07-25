---
slug: "713-subarray-product-less-than-k"
section: "coding"
title: "713. Subarray Product Less Than K"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1674972899
updated_at: 1723426964
published_at: 1674972899
---
[713\. Subarray Product Less Than K](https://leetcode.com/problems/subarray-product-less-than-k/)

這一題很是 LeetCode 上面難度中等的題目，題目結構也很容易就可以想到是滑動窗口的題目，滑動窗口的條件判斷很簡單，如果目前的積還小於 `k` ，那就繼續增大窗口，當目前的積大於 `k` 時縮小窗口，這些都不是這個問題的重點，這一題最困難的在於滑動窗口後怎麼樣去計算到底**有多少個子陣列**滿足題目的條件？

也就是下方答案的 L17 `ans += fast - slow` 這一行為什麼是對的？

```python
class Solution:
    def numSubarrayProductLessThanK(self, nums: List[int], k: int) -> int:
        if k <= 1:
            return 0
        fast = 0
        slow = 0
        res = 1
        ans = 0
        while fast < len(nums):
            num = nums[fast] 
            fast += 1
            res *= num
            while res >= k:
                num = nums[slow]
                slow += 1
                res //= num
            ans += fast - slow

        return ans

```

這個真的很不好想，但是我們可以把題目中滑動窗口的行為模擬出來一下

```python
nums = [10,5,2,6]
fast = 1, slow = 0 [10] 
fast = 2, slow = 0 [10, 5]
fast = 3, slow = 1 [5, 2]
fast = 4, slow = 1 [5, 2, 6]

```

第一個情況，子陣列的情況有 `[10]`

第二個情況，子陣列的情況有 `[10], [5], [10, 5]`

第三種情況，子陣列的情況有 `[5], [2], [5, 2]`

第四種情況，子陣列的情況有 `[5], [2], [6], [5, 2], [2, 6], [5, 2, 6]`

分析完這個情況之後，就可以解釋一下 L17 的代碼，每次窗口新增一個數字的時候，會形成窗口是$[x_{i}, ..., x_{j-1}, x_{j}]$_，_其中 $x_{j}$是加大窗口新增的數字。這時候這個窗口就是一個新的子陣列。

接下來並不是程式碼要做的事情，是如何知道我們新增一個元素後，創造了哪些新的子陣列，思考的方式是並且我們可以不斷的把元素從 $x_{i}, x_{i+1}, x_{i+2}$ 一個一個移除，以第四個情況為例，加入 6 之後的陣列是 `[5, 2, 6]` ，新增的子陣列還有 `[2, 6], [6]` 至於其他的子陣列，在上一個迭代的時候就已經考量過了，所以這就是為什麼在每次增加窗口的時候，可以用疊加的方式，將之前的結果加上滑動窗口之差，最後可以計算出總共有哪些子陣列。

至於很多地方的寫法會是 `ans = fast - slow + 1` ，這只是在處理滑動窗口時指針處理的時間點不同而已。