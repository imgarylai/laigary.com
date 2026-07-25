---
slug: "two-pointers-template"
section: "coding"
title: "Two Pointers 模板"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1784876687
updated_at: 1784876687
published_at: 1784876687
---
雙指針有三種完全不同的用法，先認出是哪一種，code 就寫得出來。

## 對撞指針：一頭一尾往中間走

**前提是陣列有序**（或問題本身對稱，如回文）。每一步都靠比較決定移動哪一邊 — 這一步就是把 $O(n^2)$ 降到 $O(n)$ 的地方。

```python
left, right = 0, len(nums) - 1
while left < right:
    total = nums[left] + nums[right]
    if total == target:
        return [left, right]
    elif total < target:
        left += 1                # 需要更大 → 左邊往右
    else:
        right -= 1               # 需要更小 → 右邊往左
```

例題：[167. Two Sum II](/interview/coding/167-two-sum-ii-input-array-is-sorted)、[125. Valid Palindrome](/interview/coding/125-valid-palindrome)、[11. Container With Most Water](/interview/coding/11-container-with-most-water)、[42. Trapping Rain Water](/interview/coding/42-trapping-rain-water)

### 3 Sum：固定一個數，剩下的用對撞

排序後固定第一個數，對剩下的區間跑對撞指針，注意**跳過重複**：

```python
nums.sort()
for i in range(len(nums) - 2):
    if i > 0 and nums[i] == nums[i - 1]:
        continue                 # 跳過重複的第一個數
    left, right = i + 1, len(nums) - 1
    while left < right:
        ...
        # 找到答案後，兩邊都要跳過重複
        while left < right and nums[left] == nums[left + 1]:
            left += 1
```

例題：[15. 3 Sum](/interview/coding/15-3-sum)

## 快慢指針：同向，但速度不同

一個負責「看」，一個負責「寫」。原地移除/去重時，慢指針就是下一個該寫入的位置：

```python
slow = 0
for fast in range(len(nums)):
    if nums[fast] != val:        # fast 看到要保留的元素
        nums[slow] = nums[fast]  # slow 負責寫
        slow += 1
return slow                      # 新長度
```

例題：[26. Remove Duplicates from Sorted Array](/interview/coding/26-remove-duplicates-from-sorted-array)、[283. Move Zeroes](/interview/coding/283-move-zeroes)

在 Linked List 上，快慢指針改成「一次走一步 / 一次走兩步」，用來找中點和判環 — 見 [Linked List 模板](/interview/coding/linked-list-template)。

## 分區指針：三路劃分

要把陣列分成三段（小於 / 等於 / 大於）時，用三個指針一次掃完：

```python
low, mid, high = 0, 0, len(nums) - 1
while mid <= high:
    if nums[mid] < pivot:
        nums[low], nums[mid] = nums[mid], nums[low]
        low += 1; mid += 1
    elif nums[mid] > pivot:
        nums[mid], nums[high] = nums[high], nums[mid]
        high -= 1            # 換過來的還沒看過，mid 不動
    else:
        mid += 1
```

`high` 那條分支 `mid` 不能加 — 這是最容易寫錯的一行。

例題：[75. Sort Colors](/interview/coding/75-sort-colors)

## 面試時的講法

先問「陣列有沒有排序」。有序 → 對撞指針；要原地改陣列 → 快慢指針；要分類 → 分區指針。如果無序而且必須排序才能做，記得把排序的 $O(n \log n)$ 算進總複雜度，並跟面試官確認可不可以改動輸入。

其他例題：[680. Valid Palindrome II](/interview/coding/680-valid-palindrome-ii)、[88. Merge Sorted Array](/interview/coding/88-merge-sorted-array)

更多題目 → [#Two Pointers](/interview/coding?tag=Two%20Pointers)
