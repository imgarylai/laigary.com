---
slug: "300-longest-increasing-subsequence"
section: "coding"
title: "300. Longest Increasing Subsequence"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973128
updated_at: 1784954103
published_at: 1674973128
---
[300. Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/)

## 動態規劃

這一個題目是比較容易用直覺判斷出是動態規劃的題目，難的地方是這個題目的動態轉移方程式，這一個題目，如果要想到動態轉移方程式的話，那就是我們在第 `i` 個位置的時候，其意義為何？

先從基本的型態會是什麼？最長的遞增子序列就只有自己而已，那時候 `dp[i]` 就會是 `1` 。

這時候我們想要知道的就是 當我們已經知道 `dp[0..i-1]` 的所有數值時，要怎麼求 `dp[i]` 的數值？

分兩個步驟想，第一個步驟是，我們要找到最長遞增子序列，和當前 `nums[i]` 有用的，只有**在我前面，比我小的數字**才有用，因為比他大的，都不可能增加最長遞增子序列的長度，所以我們要去找 `nums[0..i-1]`中 ，比 `nums[i]` 還小的數字。

找到之後，就是第二個步驟，這些比 `nums[i]` 還小的數字，\*\*他們當時的最長遞增子序列的長度為何？\*\*候選人可能有很多，但是我們知道一定是要找最長的那個，這時候就可以更新我們自己的最長遞增子序列的長度 `dp[i]` 。更新的方式如下：

```python
dp[i] = max([1 + dp[j] for j in range(i) if nums[j] < nums[i]], default=dp[i])
# j is the index which is smaller than i and contributes the 
# longest increasing subsequence.
```

```python
class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        dp = [1] * len(nums)

        for i in range(1, len(nums)):
            dp[i] = max([1 + dp[j] for j in range(i) if nums[j] < nums[i]], default=dp[i])

        return max(dp)
```

時間複雜度： $O(n^2)$

我後來第二次寫的時候，有想到一個其實比較好想到的做法：

```python
class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        # Your code goes here
        if not nums:
            return 0
        n = len(nums)

        @cache
        def helper(i, prev):
            if i == n:
                return 0
            # option to not pick
            not_pick = helper(i + 1, prev)
            # option to pick (only if greater than prev or prev == -1)
            pick = 0
            if prev == -1 or nums[i] > nums[prev]:
                pick = 1 + helper(i + 1, i)
            return max(pick, not_pick)

        return helper(0, -1)
```

這是 Top-Down 的做法，我在當前的位置，我可以不選這個數字，那我就沒有繼續遞增。

反之，如果當前的數字比前一個選的還大的時候，我可以選擇，並且繼續遞迴下去。

這時候我會有兩個 optimal 的答案，分別是選或是不選。

這時候只要較優解就好。

## 耐心排序

這個題目其實有一個更快的解法，時間複雜度只要 $O(nlogn)$ ，是使用一個叫做 [耐心排序(Patience sorting)](https://en.wikipedia.org/wiki/Patience_sorting)的方法。

講解得最好的[講義](https://www.cs.princeton.edu/courses/archive/spring13/cos423/lectures/LongestIncreasingSubsequence.pdf)，來自 Princeton

這個演算法的做法，很像是把一個亂數的鋪克牌的按照以下規則分成幾個牌堆。

當我現在手上有一張撲克牌時

1. 如果還沒有任何的牌堆，那這張卡就會建立成一個牌堆
2. 如果已經有牌堆，我要找到牌堆中最上面的數字，比我大的牌堆，如果有多個牌堆滿足此情況，我要選擇最左邊的牌堆。
3. 如果已經有牌堆，但是每個牌堆最上面的數字都比手上這張撲克牌小，則建立新牌堆

按照這樣的方式來分類牌堆，最後每一組的最上面的數字，就會是一個上升遞增子序列，最後總共有幾個牌堆就是代表有最長遞增子序列。

```python
class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        piles = [] # 牌堆，一開始沒有牌堆

        # 開始整理撲克牌
        for i in range(len(nums)):
            # 目前要整理的牌
            card = nums[i]

            # 我有哪些排堆可以整理，用二分搜索的方式來整理
            left, right = 0, len(piles) - 1
            while left <= right:
                mid = left + (right - left) // 2
                # 如果這個牌堆最上面的撲克牌比我的牌大，那我要往左邊找，而且要盡可能地往左邊放
                if piles[mid][-1] >= card:
                    right = mid - 1
                # 如果這個牌堆最上面的撲克牌比我的牌小，那我要往右邊找
                else: # piles[mid][-1] < card:
                    left = mid + 1

            # 沒有地方可以放，新增一個牌堆
            if left == len(piles):
                piles.append([])
            # 把撲克牌放入牌堆
            piles[left].append(card)
        return len(piles)
```

上面這個算法如果有幾個牌堆，就代表了最長\*\*「遞增」**子序列的值，如果要找最長**「遞減」\*\*子序列，就要找這些牌堆中，哪個牌堆的長度最長。

### 用 `bisect_left` 改寫

上面那段手寫的二分搜尋，條件是「牌堆最上面的數字 `>= card` 就往左找，而且盡可能往左放」 — 這正好就是 `bisect_left` 的語意：**第一個大於或等於 `card` 的位置**。所以整段迴圈可以直接換掉。

另外一個觀察是：分類牌堆時，我其實只用到每個牌堆**最上面**那張牌（`piles[mid][-1]`），底下壓著的牌從來沒被讀過。所以不需要存整個牌堆，只留每堆的頂牌就好 — 這個陣列習慣叫 `tails`，而且它本身一定是遞增的，所以能二分：

```python
from bisect import bisect_left

class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        tails = []                       # tails[i] = 長度為 i+1 的遞增子序列，最小的結尾值
        for num in nums:
            i = bisect_left(tails, num)
            if i == len(tails):
                tails.append(num)        # 比所有頂牌都大 → 開新牌堆
            else:
                tails[i] = num           # 頂替掉那張比較大的頂牌
        return len(tails)
```

時間複雜度 $O(n\log n)$、空間 $O(n)$，跟牌堆版一樣，但短了一大截。

要注意 `tails` **不是**答案的那個子序列，它只是「各個長度所能達到的最小結尾值」，中途看起來可能完全不像答案（例如 `nums = [10, 9, 2, 5, 3, 7]` 跑完 `tails` 是 `[2, 3, 7]`，長度 3 是對的，但真正的遞增子序列是 `2, 5, 7`）。長度永遠是對的，序列內容則要另外記 parent 指標才能還原。

這裡用 `bisect_left` 而不是 `bisect_right` 是關鍵：

- `bisect_left` 遇到**相等**的頂牌會頂替掉它，所以相同的數字不會讓長度增加 → 得到**嚴格遞增**的答案，也就是這一題要的。
- 換成 `bisect_right` 就會把相等的數字接在後面 → 變成求最長**非遞減**子序列。`nums = [1, 3, 3, 3, 5]` 兩者分別是 `3` 和 `5`。

也因為 `tails` 只留頂牌，上面那個「用牌堆長度找最長遞減子序列」的技巧在這個版本行不通 — 要那個資訊就得用原本的牌堆寫法。