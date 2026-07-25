---
slug: "162-find-peak-element"
section: "coding"
title: "162. Find Peak Element"
status: "published"
pinned: false
tags: ["Binary Search"]
created_at: 1674944054
updated_at: 1746396107
published_at: 1674944054
---
[162\. Find Peak Element](https://leetcode.com/problems/find-peak-element/)

這個題目存在著一個滿容易的解法，因為題目只要找到任意一個峰值即可，所以可以用比較直覺的方式不斷的往上爬，找到第一個下降點即可，這樣的時間複雜度會在線性的時間複雜度，其實並不算差。

但是這個題目困難是存在一個二分搜索的解法，其時間複雜度可以在對數時間複雜度找到答案。

二分搜尋的邏輯如下，每次從中間位置的值開始檢查

1.  如果中間位置下一個位置的值，比當前位置的值大，代表頂峰位於右側區間，且不包含當前的位置。（繼續爬山的概念）所以可以把左側的指針移動到當前位置的下一個位置。
2.  如果中間位置下一個位置的值，和當前為值的值一樣大，或是更小，代表現在我們可能再往下山的位置，又或是已經在頂峰了，頂峰的位置一定是在左側區間，又或是在當前的位置。所以可以把右側的指針移動到當前位置。

```python
class Solution:
    def findPeakElement(self, nums: List[int]) -> int:
        left = 0
        right = len(nums) - 1
        while left < right:
            mid = left + (right - left) // 2
            if nums[mid] < nums[mid + 1]:
                left = mid + 1
            else:
                right = mid
        return left
```

## ✅ 核心觀察（比大小找趨勢）：

這題其實不需要完全找出一個確切數值，只要找到一個「**比左右鄰居大的點**」，就可以了。關鍵邏輯是：

-   如果 `nums[mid] > nums[mid + 1]`，代表**往左邊有峰值**
    -   因為你正在下降
    -   所以 `right = mid`（保留 mid）
-   否則，`nums[mid] < nums[mid + 1]`，代表**往右邊有峰值**
    -   因為你正在上升
    -   所以 `left = mid + 1`（丟掉 mid）

* * *

## 🤔 為何使用 `while left < right`？

### ✅ 目標：縮小範圍直到「只剩一個可能點」

你不需要在迴圈內確認答案（不像 `while left <= right` 那樣會進行判斷），因為你知道：

> 只要你根據斜率方向走，**一定會收斂到一個峰值**

所以，你要：

-   **逐步縮小搜尋空間**
-   當 `left == right` 時 → 一定是一個 peak → **退出迴圈並 return left**

* * *

### ❌ 如果寫成 `while left <= right` 呢？

這會導致你必須在每次迴圈內「手動判斷是否是**峰值**」，例如你會進入額外的 `if mid == 0 or mid == n-1 or ...` 這種處理，程式碼更複雜而且不自然。

而 `left < right` 的寫法則是「純粹靠斜率方向導向」的思路，不需要明確找 peak 的條件，最終 **只剩一個點時那個點必是 peak**。