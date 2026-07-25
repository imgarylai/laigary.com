---
slug: "704-binary-search"
section: "coding"
title: "704. Binary Search"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674943839
updated_at: 1784926810
published_at: 1674943839
---
[704. Binary Search](https://leetcode.com/problems/binary-search/)

參考 [Binary Search 模板](/interview/coding/binary-search-template) 。

我在寫 Binary Search 時，基本上我是採用左右都是閉區間，因為如果右邊是開區間的時候，會容易要去想到底最後一個數字處理了嗎？或是我越界了嗎？

1. **迴圈條件用** `<=`

```py
while left <= right:
```

因為區間是閉的，`left == right` 時裡面還有**一個**元素（就是 `left` 那個），還沒檢查，不能停。這正好對應你講的擔憂——「最後一個數字處理了嗎」。閉區間版的答案是：`<=` 保證了 `left == right` 這個單元素區間一定會進迴圈被檢查，不會漏。

2. **更新邊界時要** `mid ± 1`

```py
if nums[mid] < target:
    left = mid + 1     # mid 已經檢查過且不是答案，踢出區間
else:
    right = mid - 1
```

3. **這三者是綁在一起的**

`[left, right]` 閉 → 條件 `<=` → 更新 `mid ± 1`。三個一組，動一個就得全動。你只要記住「我用閉區間」，這三件事就被鎖死了，不用每次重想。

4. **對照：右開區間為什麼讓你煩**

右開 `[left, right)` 的不變式是「答案在 `[left, right)`，右端**不含**」。它對應的三件套是：`while left < right`、更新時 `right = mid`（不減 1，因為右端本來就不含）、`left = mid + 1`。

它不是錯，很多人也愛用（尤其寫 `bisect` 類的「找插入點」時右開更自然）。但它的麻煩正如你說的：`right` 這個位置到底算不算數、初始要設 `len(nums)` 還是 `len(nums)-1`、迴圈結束時 `left` 停在哪——這些都得繞一層「右端不含」的轉換。**你覺得卡，不是你不懂，是右開的心智負擔本來就比較重。**

```python
class Solution:
    def search(self, nums: List[int], target: int) -> int:
        left = 0
        right = len(nums) - 1

        while left <= right:
            mid = left + (right - left) // 2
            if nums[mid] == target:
                return mid
            if nums[mid] > target:
                right = mid - 1
            if nums[mid] < target:
                left = mid + 1

        return -1
```

```python
class Solution:
    def search(self, nums: List[int], target: int) -> int:
        left = 0
        right = len(nums) - 1

        def binarySearch(left, right):
            if left > right:
                return -1
            mid = left + (right - left) // 2
            if nums[mid] == target:
                return mid
            if nums[mid] > target:
                return binarySearch(left, mid - 1)
            if nums[mid] < target:
                return binarySearch(mid + 1, right)

        return binarySearch(left, right)
```

