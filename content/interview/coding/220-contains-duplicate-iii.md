---
slug: "220-contains-duplicate-iii"
section: "coding"
title: "220. Contains Duplicate III"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1674965415
updated_at: 1674965442
published_at: 1674965415
---
[220\. Contains Duplicate III](https://leetcode.com/problems/contains-duplicate-iii/)

## 超時

```python
class Solution:
    def containsNearbyAlmostDuplicate(self, nums: List[int], k: int, t: int) -> bool:

        table = {}
        for i in range(len(nums)):
            num = nums[i]

            for j in range(num, num + t + 1):
                if j in table:
                    if abs(i - table[j]) <= k:
                        return True

            for j in range(num - t, num + 1):
                if j in table:
                    if abs(i - table[j]) <= k:
                        return True

            table[num] = i

        return False

```