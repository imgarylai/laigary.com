---
slug: "35-search-insert-position"
section: "coding"
title: "35. Search Insert Position"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674944173
updated_at: 1784928882
published_at: 1674944173
---
[35. Search Insert Position](https://leetcode.com/problems/search-insert-position/)

題目很明確的可以想到需要使用 [704. Binary Search](/interview/coding/704-binary-search) 來做，容易搞混的是，為什麼我們要找的是左側邊界？

1. 迴圈停下來的時候，left &gt; right ，是 left = right + 1

```
... right | left ...
   ≤ 這邊    ≥ 這邊
```

關鍵在你的更新規則替這條線兩側「貼了標籤」：

- `left = mid + 1` 只在 `nums[mid] < target` 時發生 → 凡是被踢到 `left` **左邊**的，全都 `< target`。
- `right = mid - 1` 只在 `nums[mid] >= target` 時發生 → 凡是被踢到 `right` **右邊**的，全都 `>= target`。

所以迴圈結束時，`left` 左邊全部 `< target`、`left` 位置起全部 `>= target`。那 `left` 就是**第一個** `>= target` **的位置**——這正是 target 該插進去的地方（插在它前面，維持排序）。

```python
class Solution:
    def searchInsert(self, nums: List[int], target: int) -> int:
        left = 0
        right = len(nums) - 1

        while left <= right:
            mid = left + (right - left) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] > target:
                right = mid - 1
            else:
                left = mid + 1
        
        return left
```

