---
slug: "62-unique-paths"
section: "coding"
title: "62. Unique Paths"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674944591
updated_at: 1765260647
published_at: 1674944591
---
[62\. Unique Paths](https://leetcode.com/problems/unique-paths/)

## 自頂向下

從終點往回走

```python
class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        @cache
        def dp(row, col):
            if row == 1 or col == 1:
                return 1
            return dp(row-1, col) + dp(row, col-1)
        return dp(m, n)
```

從起點往終點走

```python
class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        
        @cache
        def dp(row, col):
            if row > m or col > n:
                return 0
            if row == m or col == n:
                return 1
            return dp(row + 1, col) + dp(row, col + 1)

        return dp(1, 1)
```

## 自底向上

```python
class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        # 建立出動態規劃自底向上的表格
        dp = [[0 for _ in range(n)] for _ in range(m)]

        # Base Case 1
        # 從起點一直向右走到底都是只有一種路徑
        for row in range(m):
            dp[row][0] = 1

        # Base Case 2
        # 從起點一直向下走都是只有一種路徑
        for col in range(n):
            dp[0][col] = 1

        for i in range(1, m):
            for j in range(1, n):
                dp[i][j] = dp[i - 1][j] + dp[i][j - 1]

        return dp[m-1][n-1]
```

上面 Base Case 的情況可以合併一起處理：

```python
class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        dp = [[1 for _ in range(n)] for _ in range(m)]

        for i in range(1, m):
            for j in range(1, n):
                dp[i][j] = dp[i - 1][j] + dp[i][j - 1]

        return dp[m-1][n-1]
```