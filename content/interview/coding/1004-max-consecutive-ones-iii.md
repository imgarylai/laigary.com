---
slug: "1004-max-consecutive-ones-iii"
section: "coding"
title: "1004. Max Consecutive Ones III"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1674972898
updated_at: 1742771080
published_at: 1674972898
---
[1004\. Max Consecutive Ones III](https://leetcode.com/problems/max-consecutive-ones-iii/)

這個題目是基於題目 [485\. Max Consecutive Ones](/interview/coding/485-max-consecutive-ones) 的變形。與原始題目不同的是，這次我們不僅要處理連續的 1，還有一個額外的操作——可以將某些 0 視為 1 來處理。這個操作是由一張特殊的卡牌提供的，卡牌數量為 `k`，表示我們最多可以將 `k` 個 0 視為 1。

解決這個問題的思路依然可以使用 **滑動窗口**（sliding window）技術，但需要對基本的滑動窗口方法進行一定的變形。

在原始題目中，當遇到 1 時，我們會增大窗口的右邊界，並嘗試找出最長的連續 1 的長度。而在這個題目中，我們除了遇到 1 時增大窗口外，還可以處理最多 `k` 個 0。也就是說，當窗口中的 0 的數量不超過 `k` 時，我們可以繼續擴大窗口。

然而，這個問題的難點在於如何正確地縮小窗口。在基本題型中，當我們遇到 0 時，只需要從該位置重新開始擴大窗口即可。但在這個變形題中，當窗口中的 0 超過 `k` 時，我們需要從窗口的左側逐步縮小窗口。每當我們縮小窗口時，如果遇到 0，就需要減少我們用過的特殊卡牌數量（即恢復使用過的特殊卡牌）。

接下來是具體的解法：

```python
class Solution:
    def longestOnes(self, nums: List[int], k: int) -> int:
        slow, fast, zeros, ans = 0, 0, 0, 0

        while fast < len(nums):
            # 當前數字為 0，增加 0 的計數
            if nums[fast] == 0:
                zeros += 1

            # 如果窗口中的 0 的數量超過了 k，縮小窗口
            if zeros > k:
                # 逐步縮小左側窗口，直到 0 的數量小於等於 k
                if nums[slow] == 0:
                    zeros -= 1
                slow += 1

            # 計算當前窗口的大小，並更新答案
            ans = max(ans, fast - slow + 1)
            fast += 1

        return ans

```

### 關鍵步驟解析：

1.  **初始化指針與變數**：`slow` 和 `fast` 分別為左右窗口的指針，`zeros` 用於統計窗口中 0 的數量，`ans` 用來保存最長連續 1 的長度。
2.  **擴大窗口**：每當 `fast` 指針向右移動，若 `nums[fast]` 是 0，則將 `zeros` 加 1。
3.  **縮小窗口**：當窗口中的 0 超過了 `k`，我們通過移動 `slow` 指針來縮小窗口，並根據窗口中的 0 來調整 `zeros` 的計數。
4.  **更新結果**：每次擴大或縮小窗口後，計算當前窗口的大小，並更新最長長度 `ans`。

這樣的解法利用了滑動窗口技術，可以在 $O(n)$ 時間內解決問題，十分高效。