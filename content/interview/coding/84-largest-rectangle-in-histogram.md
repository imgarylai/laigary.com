---
slug: "84-largest-rectangle-in-histogram"
section: "coding"
title: "84. Largest Rectangle in Histogram"
status: "published"
pinned: false
tags: ["Stack"]
created_at: 1674972899
updated_at: 1766531610
published_at: 1674972899
---
[84\. Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/)

我一開始想的想法是雙指針的做法，那就是我一樣從左右往中間逼近，但是呢，逼近的過程中我先找出哪個高度最低，那這個高度就會決定了在目前左右寬的情況下，最大的面積，但是這樣並不能保證一定是最大的面積，可是我們已經把最短的邊給使用掉了，接下來我就從當下的座標，往左往右尋找，在剔除最短的高度的情況下，縮短寬度是不是有機會有更大的高度來算出更大的矩形。

## 遞迴法：（超時？）

```python
class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:       
        def helper(start, end):
            if start > end:
                return 0
            min_h_index = start
            # searching space from start to end + 1
            for i in range(start, end + 1):
                if heights[i] < heights[min_h_index]:
                    min_h_index = i
            return max(heights[min_h_index] * (end - start + 1 ), helper(start, min_h_index - 1), helper(min_h_index + 1, end))
        return helper(0, len(heights) - 1)

```

我個人會覺得，如果在面試可以寫出以上的寫法，並不算太差，不過這題不存在著重疊子問題，所以也沒辦法用 DP 來優化。

* * *

### 核心概念：找尋矩形的邊界

要計算一個矩形的面積，我們需要知道它的**高度 (Height)** 和**寬度 (Width)**。

對於 `heights` 陣列中的每一個柱子，如果我們把它當作矩形的「高度」，那麼這個矩形能擴張多遠，取決於它的**左右兩側第一個比它矮的柱子**在哪裡。

第一個 `for` 迴圈的目的

這個 `for` 迴圈的主要任務是：**遍歷每一個柱子，並在發現「轉折點」時開始計算面積。**

1.  **維持單調性**：我們把柱子的「索引」存入疊棧（stack）中，確保疊棧裡的柱子高度是由低到高排列的。
2.  **觸發計算**：當我們遇到一個比疊棧頂端還要「矮」的柱子時（即 `heights[i] < heights[stack[-1]]`），這意味著疊棧頂端的那個柱子**往右邊的擴張到頭了** 🛑。

當我們發現當前的柱子比疊棧頂端的柱子矮時，就代表疊棧頂端那個高度的矩形「向右擴張」遇到了瓶頸。

第一個 `for` 迴圈的意義，就在於**由左向右掃描**，為每一個柱子尋找它的**右邊界**（第一個比它矮的柱子）。

這時候，疊棧（Stack）發揮了兩個關鍵作用：

1.  **確定高度**：`stack.pop()` 出來的索引對應的高度，就是我們要計算的矩形高度。
2.  **確定左邊界**：當我們 pop 出高度後，**新的棧頂元素**（如果有的話）就是該高度「向左擴張」遇到的第一個比它矮的柱子，也就是它的左邊界。

### 讓我們計算一下寬度

回到剛剛的例子：`heights = [2, 1, 5, 6, 2]`。 當我們處理到 `i = 1`（高度是 1）時，發現它比 stack 裡的 `heights[0]`（高度是 2）還要矮。

1.  我們把 `index 0` 彈出來，得到 `height = 2`。
2.  這時候 stack 空了，代表高度為 2 的這個矩形，左邊沒有任何東西擋住它。

在這個程式碼中，計算寬度的邏輯是：

```python
if not stack:
    width = i
else:
    width = i - stack[-1] - 1
```

這也是一個很困難的地方

當 `stack` 為空時，為什麼寬度直接等於 `i`？而當 `stack` 還有東西時，為什麼寬度要用 `i - stack[-1] - 1` 呢？你可以試著用 `i = 1` 且 stack 為空的狀況帶入看看。

### 為什麼寬度是 `i`？

讓我們用數字來感覺一下： 假設 `heights = [2, 1, 5]`，現在 `i = 1`（高度是 1）。

1.  我們發現 `1 < 2`，所以把 `index 0` (高度 2) 彈出來。
2.  這時候 `stack` 變空了。
3.  根據程式碼，`width = i`，也就是 `width = 1`。

這裡的 `width = 1` 代表的是\*\*「高度為 2 的那個矩形」\*\*所能延伸的寬度。因為它右邊被高度 1 擋住了，所以它只能佔據索引 `0` 這一個位置，寬度確實是 1。

### 關鍵點：誰是主角？

當我們計算 `area = max(area, width * height)` 時，這個 `height` 是剛剛從 `stack.pop()` 拿出來的那個高度。

-   **如果 stack 空了**：代表這個 `height` 比左邊所有的柱子都矮（或者它是第一個），所以它可以一路往左延伸到開頭（索引 0）。那麼它的總寬度就是從 `0` 到 `i-1`，總共 `i` 個單位。
-   **如果 stack 還有剩**：代表左邊有一個比它更矮的柱子（即 `stack[-1]`）擋住了它。所以它只能從 `stack[-1] + 1` 延伸到 `i - 1`。

```python
class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        n = len(heights)
        if n == 0:
            return 0
        if len == 1:
            return heights[0]
        area = 0

        stack = []
        for i in range(n):
            # 當 stack 不為空時，代表距離現在的位置 i ，左邊至少還有 bar ，因為遇到一個右邊比他矮的 bar ，所以"他不能夠向右延伸了"
            # 因此我們可以計算這個 bar 透過左邊的 bar 可以形成多大的矩形
            # 在這個 while loop 裡面，i 是不變的
            while stack and heights[stack[-1]] > heights[i]:
                # 開始從高的處理
                height = heights[stack.pop()]

                width = 0
                # 如果沒有左邊的 bar ，可以是這是第一個 bar ，或是之前都是更高的 bar 所以每次入棧之前都被 pop 光了，所以寬度是 i 
                # 可以用 [5, 4, 3, 2, 1] 來思考
                if not stack:
                    width = i
                # 還有左邊，左邊會是比現在更矮的 bar ，因為 i 固定，等下計算寬度的時候會計算出更寬的寬度。
                else:
                    width = i - stack[-1] - 1

                area = max(area, width * height)
            stack.append(i)

        # 剩下的情況是前面只有比較矮的 bar ，例如: [2, 4, 6]
        while stack:
            height = heights[stack.pop()]
            width = 0
             
            if not stack:
                width = n
            else:
                width = n - stack[-1] - 1

            area = max(area, width * height)

        return area

```