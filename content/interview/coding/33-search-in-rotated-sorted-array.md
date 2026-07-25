---
slug: "33-search-in-rotated-sorted-array"
section: "coding"
title: "33. Search in Rotated Sorted Array"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674860516
updated_at: 1711862755
published_at: 1674860516
---
[33\. Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/)

1.  中間的值和目標相同：答案
2.  如果最左邊的值比中間值值小，有兩種情況
    1.  如果目標的值等於或大於最左邊的值且小於中間的值，則左邊是沒有被旋轉影響的區間，又目標一定是在這個區間，此時左邊區間的值是由左依序往中間遞增，而且目標也在這個區間，代表目標一定是在 \[left, mid) 這個區間，所以將右邊界設定成 right = mid - 1。
    2.  被旋轉影響的區間在右邊，且目標值在右邊這個區間，將左邊界設定至 left = mid + 1 繼續搜尋。
3.  如果最左邊的值比中間值值大，有兩種情況
    1.  如果目標的值大於中間的值且小於或等於最右邊的值，則右邊是沒有被旋轉影響的區間，又目標一定是在這個區間，此時右邊的區間是由中間往最右邊依序遞增，而且目標也在這個區間，代表目標一定是在 (mid, right\] 這個區間，所以將左邊界設定成 left = mid + 1 。
    2.  被旋轉影響的區間在左邊，且目標值在左邊這個區間，將右邊邊界設定至 right = mid - 1 繼續搜尋。

```python
class Solution:
    def search(self, nums: List[int], target: int) -> int:
        left = 0
        right = len(nums) - 1
        while left <= right:
            mid = left + (right - left) //2
            if nums[mid] == target:
                return mid
            elif nums[mid] >= nums[left]:
                if nums[left] <= target < nums[mid]:
                    right = mid -1
                else: # nums[left] > target or nums[mid] <= target:
                    left = mid + 1
            else:
                if nums[mid] < target <= nums[right]:
                    left = mid + 1
                else: # target <= nums[mid] or target > nums[right]:
                    right = mid - 1
        return -1
```