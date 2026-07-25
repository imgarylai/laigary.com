---
slug: "221-maximal-square"
section: "coding"
title: "221. Maximal Square"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674948596
updated_at: 1705295966
published_at: 1674948596
---
[221\. Maximal Square](https://leetcode.com/problems/maximal-square/)

💡

這個題目有動態規劃的最佳解，不過這個題目如果使用窮舉的話是不會超時的，所以我很建議可以就從窮舉來想，再看看能不能優化。

## 窮舉法

題目給定的矩陣長寬是不定的，而假設今天如果題目的矩陣全部都是 1 ，那今天在這個矩陣長方形內，最大的正方形邊長一定是長或寬的短邊。

```python
rows = len(matrix)
columns = len(matrix[0])
m = min(rows, columns)
```

這時候可以從兩個方向來寫

1.  從最小的正方形邊長 1 開始檢查，一直檢查到最大的正方形邊長 `m` ，如果說一直到 `m` 都可以的話，那最大面積就會是 $m^{2}$。
2.  從最大的正方形邊長 `m` 開始檢查，一直檢查到最小的正方形邊長 1，如果存在一個正方形滿足題目條件，則馬上回傳面積。

我選擇的是第二條路，因為是窮舉法，又是要找最大，我當然是趕快找到最大的正方形就好。

```python
class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        rows = len(matrix)
        columns = len(matrix[0])
        L = min(rows, columns) # Longer Side

        def is_square(row, col, length):
            i = row
            while i < (row + length):
                j = col
                while j < (col + length):
                    if matrix[i][j] == '0':
                        return False
                    j += 1
                i += 1
            return True

        while L > 0: 
            i = 0
            while i < rows - L + 1:
                j = 0
                while j < columns - L + 1:
                    if is_square(i, j, L):
                        return L ** 2
                    j += 1
                i += 1
            L -= 1
        return 0
```

## 動態規劃

如果從左上往右下開始找尋最大的正方形，一定是首先自己的位置要是 1 ，接著，去看可以來到這個位置的三個方向：上、左、左上去看看是不是都是 1 ，但是這樣我們還要繼續往回找，看看是不是都是 1 ，因此最好的方法應該是在找尋的時候，就順便記錄起來。

至於紀錄的方式，就是我們看左上、上、左，可以形成的最大正方形中，哪一個最小，動態轉移方程式就是：

```python
dp[row][col] = min(dp[row-1][col], dp[row][col-1], dp[row-1][col-1]) + 1
```
```python
class Solution:
    def maximalSquare(self, matrix: List[List[str]]) -> int:
        rows = len(matrix)
        columns = len(matrix[0])
        dp = [[0] * (columns + 1) for _ in range(rows + 1)]
        m = 0
        for row in range(1, rows + 1):
            for col in range(1, columns + 1):
                if matrix[row-1][col-1] == '1':
                    dp[row][col] = min(dp[row-1][col], dp[row][col-1], dp[row-1][col-1]) + 1
                    m = max(dp[row][col], m)

        return m ** 2
```