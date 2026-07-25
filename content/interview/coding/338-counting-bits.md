---
slug: "338-counting-bits"
section: "coding"
title: "338. Counting Bits"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1784349238
updated_at: 1784611958
published_at: 1784530058
---
[**338. Counting Bits**](https://leetcode.com/problems/counting-bits/)

```python
class Solution:
    def countBits(self, n: int) -> List[int]:
        
        dp = [0] * (n + 1)
        for i in range(1, n + 1):
            dp[i] = dp[i // 2] + (i % 2)
        return dp
```

這個題目雖然標注是簡單，但是我第一次在寫的時候其實完全忘記了裡面所需要的數學，這我都忘記是不是高中數學了？

題目的問題很簡單，給一個數字 \`n\`，我們要回傳一個陣列，陣列的長度就是 `n` ，每一個位置就是該數字有幾個 1

```text
0 --> 0
1 --> 1
2 --> 10
3 --> 11
4 --> 100
5 --> 101
```

結果就是 \[0, 1, 1, 2, 1, 2\]

我一開始看到的時候完全卡住了，因為我看不出規律，但實際上的規律其實很簡單，當給定數字 k ，他會有幾個 1 決定在 k / 2整數除法後的數字，他的二進位有幾個 1 加上 k 對 2 求餘數的答案。

動態規劃的關係式就是

```text
dp[i] = dp[i / 2] + (i % 2)
```