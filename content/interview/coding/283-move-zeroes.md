---
slug: "283-move-zeroes"
section: "coding"
title: "283. Move Zeroes"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972895
updated_at: 1766303957
published_at: 1674972895
---
[283\. Move Zeroes](https://leetcode.com/problems/move-zeroes/)

這個題目有點陷阱，題目要求要把零搬到最後，不過用這個角度去想的話，題目真的不好想，比較好做的做法需要有反面的想法：

💡

把所有的零搬到後面等於把所有非零的數字搬到前面

光是這樣想很簡單，但是要做到這個目的，需要想到一個重要的關鍵點，那就是我們要怎麼樣把數字往前搬。

因為要把數字從後面往前搬，代表我們需要一個走得快一點的指針，可以走到更後面，不是零的地方。

這也代表，我們需要一個比較慢的指針，比快指針前面有零的位置，這樣當快指針遇到非零的數字，我們可以搬過去。

最後有一的重點，快指針全部走完的時候，事情還沒有做完，當快指針走完的時候，意義上我們是把所有非零的數字都往前搬了，但是在記憶體裡面，這些搬走的數字，其實並沒有被零替換掉。

所以最後我們要慢指針全部走完，把剩餘記憶體中的內容全部歸零。

```python
class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        slow = 0
        fast = 0

        while fast < len(nums):
            if nums[fast] != 0:
                nums[slow] = nums[fast]
                slow += 1
            fast += 1

        while slow < len(nums):
            nums[slow] = 0
            slow += 1

```

* * *

直覺做法

上面的做法是我想得太複雜了

```python
class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        
        slow = 0
        fast = 0

        while fast < len(nums):
            if nums[fast] != 0:
                nums[slow], nums[fast] = nums[fast], nums[slow]
                slow += 1
            fast += 1
```
```python
class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        
        nextNoneZero = 0

        for i in range(len(nums)):
            if nums[i] != 0:
                nums[nextNoneZero], nums[i] = nums[i], nums[nextNoneZero]
                nextNoneZero += 1
```