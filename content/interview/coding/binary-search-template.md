---
slug: "binary-search-template"
section: "coding"
title: "Binary Search 模板"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1784876687
updated_at: 1784876687
published_at: 1784876687
---
Binary Search 的難不在概念，在**邊界**。與其每次現想，不如固定一種寫法練到不用思考 — 我用的是左閉右閉 `[left, right]`。

```python
def search(nums, target):
    left, right = 0, len(nums) - 1   # 右邊界是可及的索引
    while left <= right:             # 區間非空的條件
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1           # 丟掉 mid
        else:
            right = mid - 1          # 丟掉 mid
    return -1
```

三個地方要一致：`right` 的初值、`while` 的比較符號、更新時有沒有 `± 1`。只要選定左閉右閉，就永遠是 `len - 1`、`<=`、`mid ± 1`。

例題：[704. Binary Search](/interview/coding/704-binary-search)、[35. Search Insert Position](/interview/coding/35-search-insert-position)

## 找邊界：把「找到了」也繼續縮

面試更常考的是「第一個 ≥ target 的位置」而不是「任一個 target」。差別只在**找到之後不 return，而是繼續往那一側縮**：

```python
def lower_bound(nums, target):
    """第一個 >= target 的索引；不存在時回傳 len(nums)"""
    left, right = 0, len(nums)       # 這裡用左閉右開比較好寫
    while left < right:
        mid = (left + right) // 2
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid              # 答案可能就是 mid，不能丟
    return left
```

找右邊界就是把 `<` 改成 `<=`，最後回傳 `left - 1`。

例題：[34. Find First and Last Position of Element in Sorted Array](/interview/coding/34-find-first-and-last-position-of-element-in-sorted-array)

## 對答案二分：真正的考點

當題目問「最小的 X 使得條件成立」，而且 X 越大越容易成立（單調性），就能對**答案的值域**二分，而不是對陣列二分：

```python
def min_feasible(lo, hi, feasible):
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid                 # mid 可行，答案在左半（含 mid）
        else:
            lo = mid + 1
    return lo
```

寫之前先回答兩件事：**值域的上下界是什麼**、**`feasible(x)` 怎麼在 $O(n)$ 判斷**。剩下的就是套模板。

例題：[875. Koko Eating Bananas](/interview/coding/875-koko-eating-bananas)、[1011. Capacity To Ship Packages Within D Days](/interview/coding/1011-capacity-to-ship-packages-within-d-days)

## 旋轉陣列：先判斷哪半邊有序

旋轉過的陣列不整體有序，但**對半切之後一定有一半是有序的**。判斷 target 在不在那個有序半邊，決定往哪走：

```python
if nums[left] <= nums[mid]:          # 左半有序
    if nums[left] <= target < nums[mid]:
        right = mid - 1
    else:
        left = mid + 1
else:                                # 右半有序
    if nums[mid] < target <= nums[right]:
        left = mid + 1
    else:
        right = mid - 1
```

例題：[33. Search in Rotated Sorted Array](/interview/coding/33-search-in-rotated-sorted-array)、[153. Find Minimum in Rotated Sorted Array](/interview/coding/153-find-minimum-in-rotated-sorted-array)、[162. Find Peak Element](/interview/coding/162-find-peak-element)

## 面試時的講法

先說出**單調性在哪裡** — 「陣列有序」或「答案越大越容易滿足」— 這是能用二分的唯一理由，講清楚了面試官就知道你不是在硬套。接著講你要找的是「值」還是「邊界」，最後才寫 code。

其他例題：[74. Search a 2D Matrix](/interview/coding/74-search-a-2d-matrix)、[278. First Bad Version](/interview/coding/278-first-bad-version)、[4. Median of Two Sorted Arrays](/interview/coding/4-median-of-two-sorted-arrays)

更多題目 → [#Binary Search](/interview/coding?tag=Binary%20Search)
