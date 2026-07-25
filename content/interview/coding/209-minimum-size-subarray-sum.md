---
slug: "209-minimum-size-subarray-sum"
section: "coding"
title: "209. Minimum Size Subarray Sum"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972895
updated_at: 1709522927
published_at: 1674972895
---
[209\. Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/)

題目有給目標值，要找尋的子陣列是子陣列總和大於或等於目標值即可。

所以滑動窗口的題目，我們只要找到子陣列的總和開始大於或等於目標的時候，就可以開始縮減窗口，可是要注意一個地方，**滑動窗口的題目，一定要注意是在何時更新我們的答案**。

這個題目裡面，當縮減窗口的條件一達成的時候，還不用急著滑動左邊的窗口，就可以先計算出答案，如下方的答案所示。

```python
class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:

        ans = float('inf')
        fast = 0
        slow = 0
        acc = 0
        while fast < len(nums):
            num = nums[fast]
            fast += 1
            acc += num

            while acc >= target:
                ans = min(ans, fast - slow)
                d = nums[slow]
                slow += 1
                acc -= d

        return 0 if ans == float('inf') else ans

```

或是習慣先縮減窗口也可以，但是求值時要記得再加一回來。

```python
class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:

        ans = float('inf')
        fast = 0
        slow = 0

        acc = 0
        while fast < len(nums):
            num = nums[fast]
            fast += 1
            acc += num

            while acc >= target:
                d = nums[slow]
                slow += 1
                acc -= d
                ans = min(ans, fast - slow + 1)

        return 0 if ans == float('inf') else ans

```