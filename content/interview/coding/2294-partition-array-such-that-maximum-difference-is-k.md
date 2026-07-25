---
slug: "2294-partition-array-such-that-maximum-difference-is-k"
section: "coding"
title: "2294. Partition Array Such That Maximum Difference Is K"
status: "published"
pinned: false
tags: ["Greedy"]
created_at: 1743735509
updated_at: 1743737820
published_at: 1743735509
---
[2294\. Partition Array Such That Maximum Difference Is K](https://leetcode.com/problems/partition-array-such-that-maximum-difference-is-k/)

這個題目屬於 [Greedy](/interview/coding?tag=Greedy) 的題目，最困難的地方就是可以知道這是 Greedy 的題目。

```python
class Solution:
    def partitionArray(self, nums: List[int], k: int) -> int:
        
        nums.sort()

        count = 0

        slow = 0
        fast = 0

        count = 1
        while fast < len(nums):
            if nums[fast] - nums[slow] > k:
                slow = fast
                count += 1
            fast += 1
        
        return count
```