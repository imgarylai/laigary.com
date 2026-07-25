---
slug: "1423-maximum-points-you-can-obtain-from-cards"
section: "coding"
title: "1423. Maximum Points You Can Obtain from Cards"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1766342845
updated_at: 1766343172
published_at: 1766342845
---
[1423\. Maximum Points You Can Obtain from Cards](https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/)

我一開始的想法是，基礎的答案就會是前 `k` 的元素

接著我

1.  把第 k 個元素移除後，再把最後一個元素加進來
2.  把第 k - 1 個元素移除後，再把倒數第二個元素加進來
3.  把第 k - 3 個元素移除後，再把倒數第三個元素加進來
4.  把第 k - i 個元素移除後，再把倒數第 i 個元素加進來

第 k - i 個元素的位置會是在 k - i - 1

倒數第 i 個元素會在 -i - 1 的位置上

```python
class Solution:
    def maxScore(self, cardPoints: List[int], k: int) -> int:
        res = 0
        for i in range(k):
            res += cardPoints[i]

        state = res
        for i in range(k):
            state = state - cardPoints[k - i - 1] + cardPoints[-i-1]
            res = max(res, state)
        return res
```

或是其實簡單一點， 在 for loop 直接用第幾個來算還比較容易。

```python
class Solution:
    def maxScore(self, cardPoints: List[int], k: int) -> int:
        res = 0
        for i in range(k):
            res += cardPoints[i]

        state = res
        for i in range(1, k + 1):
            state = state - cardPoints[k - i] + cardPoints[-i]
            res = max(res, state)
        return res
```