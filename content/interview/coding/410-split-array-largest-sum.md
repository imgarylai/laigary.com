---
slug: "410-split-array-largest-sum"
section: "coding"
title: "410. Split Array Largest Sum"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1723605110
updated_at: 1761885976
published_at: 1723605110
---
[410\. Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/)

原題： [1011\. Capacity To Ship Packages Within D Days](/interview/coding/1011-capacity-to-ship-packages-within-d-days)

```python
class Solution:
    def shipWithinDays(self, weights: List[int], days: int) -> int:
        
        def weighting(capacity):
            total = 1
            acc = 0
            for weight in weights:
                if acc + weight > capacity:
                    acc = weight
                    total += 1
                else:
                    acc += weight
            return total
        
        left = max(weights)
        right = sum(weights) + 1

        while left <= right:
            mid = left + (right - left) // 2
            if weighting(mid) > days:
                left = mid + 1
            else:
                right = mid - 1
        
        return left

```