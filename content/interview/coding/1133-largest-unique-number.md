---
slug: "1133-largest-unique-number"
section: "coding"
title: "1133. Largest Unique Number"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1743743549
updated_at: 1743743571
published_at: 1743743549
---
[1133\. Largest Unique Number](https://leetcode.com/problems/largest-unique-number/)

```python
class Solution:
    def largestUniqueNumber(self, nums: List[int]) -> int:
        nums.sort()
        
        table = defaultdict(int)
        
        for num in nums:
            table[num] += 1
        
        res = -1
        for key, val in table.items():
            if val == 1:
                res = max(res, key)
        
        return res
```