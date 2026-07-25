---
slug: "27-remove-element"
section: "coding"
title: "27. Remove Element"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972894
updated_at: 1674972894
published_at: 1674972894
---
[27\. Remove Element](https://leetcode.com/problems/remove-element/)

要從兩個方向看

1.  如果現在最右邊的指針，當下的值和 val 相同，想辦法往左邊移，移動到和 val 不同即可停止。
2.  如果左邊的指針指到的值剛好和 val 相同，將這個值往後面丟（和右邊指針的值交換）

```python
class Solution:
    def removeElement(self, nums: List[int], val: int) -> int:
        left = 0
        right = len(nums) - 1

        while left < right:
            while nums[right] == val and left < right:
                right -= 1
            if nums[left] == val:
                nums[left], nums[right] = nums[right], nums[left]
            left += 1

        return sum([1 for num in nums if num != val])

```