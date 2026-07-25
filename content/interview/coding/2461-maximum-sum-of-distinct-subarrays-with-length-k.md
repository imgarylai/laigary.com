---
slug: "2461-maximum-sum-of-distinct-subarrays-with-length-k"
section: "coding"
title: "2461. Maximum Sum of Distinct Subarrays With Length K"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1766358668
updated_at: 1766362091
published_at: 1766358668
---
[2461\. Maximum Sum of Distinct Subarrays With Length K](https://leetcode.com/problems/maximum-sum-of-distinct-subarrays-with-length-k/)

這個題目的的困難點是如何記錄獨一無二的數字：

1.  在不斷前進的過程中，如果一直出現一樣的數字，那 Hash Table 記錄的個數只會有這一個，只是該數字的次數不斷增加。此時 Hash Table 的 size 會是小於 `k` 。
2.  在不斷前進的過程中，如果一直出現不同的數字，那 Hash Table 記錄的個數就會一直增加，每個數字的次數也只會有一個，因此如果檢查 Hash Table 裡面有多少個內容的時候，Hash Table 的 size 會是大於 `k` 。

```python
class Solution:
    def maximumSubarraySum(self, nums: List[int], k: int) -> int:
        
        n = len(nums)

        table = defaultdict(int)
        slow = 0
        res = 0
        state = 0
        for fast in range(n):
            curr = nums[fast]
            state += curr
            table[curr] += 1
            
            if fast - slow == k:
                state -= nums[slow]
                table[nums[slow]] -= 1
                if table[nums[slow]] == 0:
                    del table[nums[slow]]
                slow += 1
            
            if fast - slow + 1 == k and len(table) == k:
                res = max(res, state)
        return res
```

```python
class Solution:
    def maximumSubarraySum(self, nums: List[int], k: int) -> int:
        
        n = len(nums)

        table = defaultdict(int)
        slow = 0
        res = 0
        state = 0
        for fast in range(n):
            curr = nums[fast]
            state += curr
            table[curr] += 1
            
            if fast - slow + 1 == k:
                if len(table) == k:
                    res = max(res, state)
                state -= nums[slow]
                table[nums[slow]] -= 1
                if table[nums[slow]] == 0:
                    del table[nums[slow]]
                slow += 1
        return res
```