---
slug: "485-max-consecutive-ones"
section: "coding"
title: "485. Max Consecutive Ones"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1674972900
updated_at: 1709523349
published_at: 1674972900
---
[485\. Max Consecutive Ones](https://leetcode.com/problems/max-consecutive-ones/)

這也是一個滑動窗口的應用，右邊指針不斷的往右側前進，如果說一直是一的話，左側的指針就不會動，右指針的位置減去左指針的位置就是連續 1 的數量。

為什麼可以這樣做是因為兩個原因

1.  在我已經取得了當下的位置的時候，右側指針就已經向前移一步了。
2.  如果當下的數字是 0 ，右側指針已經往前了，左側指針也會移動到現在右側指針的位置，所以左指針和右指針又同步了。因此後面繼續探索的步驟和初始狀態一樣。

```python
class Solution:
    def findMaxConsecutiveOnes(self, nums: List[int]) -> int:
        left = 0
        right = 0
        ans = 0
        while right < len(nums):
            num = nums[right]
            right += 1
            if num == 1:
                ans = max(ans, right - left)
            else:
                left = right
        return ans

```