---
slug: "2300-successful-pairs-of-spells-and-potions"
section: "coding"
title: "2300. Successful Pairs of Spells and Potions"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1744255806
updated_at: 1744255821
published_at: 1744255806
---
[2300\. Successful Pairs of Spells and Potions](https://leetcode.com/problems/successful-pairs-of-spells-and-potions/)

```python
class Solution:
    def successfulPairs(self, spells: List[int], potions: List[int], success: int) -> List[int]:
        def search(arr, target):
            left = 0
            right = len(arr)
            while left < right:
                mid = left + (right - left)//2
                if arr[mid] >= target:
                    right = mid
                else:
                    left = mid + 1
            return left
        
        potions.sort()

        res = []
        m = len(potions)
        for spell in spells:
            i = search(potions, success/spell)
            res.append(m - i)
        
        return res
```