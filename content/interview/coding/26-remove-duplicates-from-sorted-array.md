---
slug: "26-remove-duplicates-from-sorted-array"
section: "coding"
title: "26. Remove Duplicates from Sorted Array"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972894
updated_at: 1721539880
published_at: 1674972894
---
[26\. Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/)

題目的標題寫的並不是很清楚，這個題目其實是要把

雙指針問題

```text
class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        slow = 0
        fast = 0

        while fast < len(nums):
            if nums[fast] != nums[slow]:
                slow += 1
                nums[slow] = nums[fast]
            fast += 1

        return slow + 1

```