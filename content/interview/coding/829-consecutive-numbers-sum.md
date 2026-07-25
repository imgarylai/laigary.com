---
slug: "829-consecutive-numbers-sum"
section: "coding"
title: "829. Consecutive Numbers Sum"
status: "published"
pinned: false
tags: ["Math"]
created_at: 1674972899
updated_at: 1674972899
published_at: 1674972899
---
[829\. Consecutive Numbers Sum](https://leetcode.com/problems/consecutive-numbers-sum/)

題目給定一個 `n` ，要求要找出總共存在著幾組連續整數，其總和為 `n` ，這一題是困難等級的題目，不過存在著一個簡單的解（非最優解）。

題目有給一個條件是「連續整數」。連續 `k` 個整數可以用 $x, x + 1, x + 2, …, x+k-1$來表示。

總和可以用 $kx + (0 + 1 + 2 + … + (k-1)) = kx + \frac{(k-1)k}{2}$ 來表示，以下例子以當 n = 15 時求解。

| k | 總和 | x | 組合 | | :--- | :--- | :--- | :--- | | 1 | x | **15** | 15 | | 2 | 2x + 1 | **7** | 7, 8 | | 3 | 3x + 3 | **4** | 4, 5, 6 | | 4 | 4x + 6 | 2.25 |  | | 5 | 5x + 10 | **1** | 1, 2, 3, 4, 5 | | 6 | 6x + 15 | **0** |  | | 7 | 7x + 21 | -0.857142857 |  |

透過上面的表格，我們就可以知道，

1.  可以從 k = 1 開始去求解
2.  求解的過程中 x 要是**整數**才是正確的
3.  總和的常數項，是前一個 k 值不斷累積起來的結果
4.  k 的結束條件是當 k >= n 時就要結束。

```python
class Solution:
    def consecutiveNumbersSum(self, n: int) -> int:
        ans = 0
        constant = 0
        divisor = 1
        while constant < n:
            if ((n - constant) / divisor).is_integer():
                ans += 1 

            constant = constant + divisor
            divisor += 1

        return ans

```

理論上時間複雜度應該只會到 $O(n/2)$。