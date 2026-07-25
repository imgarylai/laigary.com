---
slug: "3432-count-partitions-with-even-sum-difference"
section: "coding"
title: "3432. Count Partitions with Even Sum Difference"
status: "published"
pinned: false
tags: ["Prefix Sum"]
created_at: 1764913910
updated_at: 1764913928
published_at: 1764913910
---
[3432\. Count Partitions with Even Sum Difference](https://leetcode.com/problems/count-partitions-with-even-sum-difference/)

```python
class Solution:
    def countPartitions(self, nums: List[int]) -> int:
        total = sum(nums)
        prefixSum = [num for num in nums]
        for i in range(1, len(nums)):
            prefixSum[i] = prefixSum[i - 1] + nums[i]
        
        count = 0
        for i in range(len(prefixSum) - 1):
            left = prefixSum[i]
            right = total - left
            if abs(left - right) % 2 == 0:
                count += 1
        
        return count
```