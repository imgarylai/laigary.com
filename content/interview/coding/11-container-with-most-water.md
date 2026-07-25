---
slug: "11-container-with-most-water"
section: "coding"
title: "11. Container With Most Water"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972894
updated_at: 1703831875
published_at: 1674972894
---
[11\. Container With Most Water](https://leetcode.com/problems/container-with-most-water/)

解題的核心想法是有一句俗諺：**水桶的最大容量決定於最矮的一邊**。

題目給出的正是水桶高度，只是俗諺中的水桶，底部的面積都一樣，這個題目裡面，我們有不同的水桶面積與水桶壁的高度組合。

所以我們就不斷地從左右向中間逼近，逼近的技巧是，因為每次逼近的時候水桶底部面積都會縮小，所以我們要盡可能地保留比較高的邊，去嘗試看看在逼近到中間時，會不會有更高的水桶壁，進而去挑戰更多的容積。

```python
class Solution:
    def maxArea(self, height: List[int]) -> int:
        left = 0
        right = len(height) - 1
        max_area = 0
        while left < right:
            width = right - left
            max_area = max(max_area, min(height[left], height[right]) * width)
            if height[left] < height[right]:
                left += 1
            else:
                right -= 1
        return max_area

```