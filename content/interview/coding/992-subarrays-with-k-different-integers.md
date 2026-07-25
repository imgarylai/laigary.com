---
slug: "992-subarrays-with-k-different-integers"
section: "coding"
title: "992. Subarrays with K Different Integers"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972894
updated_at: 1709523102
published_at: 1674972894
---
[992\. Subarrays with K Different Integers](https://leetcode.com/problems/subarrays-with-k-different-integers/)

先見算出「最多」 k 個不同的數字的組合，接著再算出「最多」 k -1 個不同數字的組合，兩個數字的差就是「剛好」有 k 個數字的組合。

算出最多有 k 個不同的數字的組合，可以用滑動窗口的方式來計算。

算出最多有 k 個不同的數字的組合可以參考 [340\. Longest Substring with At Most K Distinct Character](/interview/coding/340-longest-substring-with-at-most-k-distinct-character) 。

```python
class Solution:
    def subarraysWithKDistinct(self, nums: List[int], k: int) -> int:
        def atMostK(k):
            fast = 0
            slow = 0
            memo = defaultdict(int)
            res = 0
            while fast < len(nums):
                char = nums[fast]
                fast += 1

                memo[char] += 1

                while len(memo) > k:
                    d = nums[slow]
                    slow += 1
                    memo[d] -= 1
                    if memo[d] == 0:
                        del memo[d]
                res += fast - slow
            return res
        return atMostK(k) - atMostK(k - 1)

```