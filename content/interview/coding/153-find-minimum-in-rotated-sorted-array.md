---
slug: "153-find-minimum-in-rotated-sorted-array"
section: "coding"
title: "153. Find Minimum in Rotated Sorted Array"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674943661
updated_at: 1711864995
published_at: 1674943661
---
[153\. Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)

這個題目存在時間複雜度為線性的解法，那就是不管陣列有沒有排序，線性掃描整個陣列後，就可以找到最小值。

不過這個題目存在對數時間複雜度的解法，是透過二分搜索的方式找到答案。

1.  如果中間的值比最右邊的大，那代表最小值在中間位置的右側區間。
    1.  `[2, 3, 4, 5, 1]`
    2.  `[3, 4, 5, 1, 2]`
2.  如果中間的值比最右邊的小，那代表最小值在中間位置的左側區間。
    1.  `[4, 5, 1, 2, 3]`
    2.  `[5, 1, 2, 3, 4]`
    3.  `[1, 2, 3, 4, 5]`

```python
class Solution:
    def findMin(self, nums: List[int]) -> int:
        left = 0
        right = len(nums) - 1

        while left < right:
            mid = left + (right - left ) // 2
            if nums[mid] > nums[right]:
                left = mid + 1
            else:
                right = mid
        return nums[left]
```