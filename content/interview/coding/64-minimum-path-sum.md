---
slug: "64-minimum-path-sum"
section: "coding"
title: "64. Minimum Path Sum"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674944659
updated_at: 1765261552
published_at: 1674944659
---
[64\. Minimum Path Sum](https://leetcode.com/problems/minimum-path-sum/)

## 自頂向下

從最後一個位置向原點出發，每次都往總和比較小的路徑前進，直到原點為止，找出最小的總和。

```python
class Solution:
    def minPathSum(self, grid: List[List[int]]) -> int:
        rows = len(grid)
        cols = len(grid[0])
        
        @cache
        def dp(row, col):
            if row < 0 or col < 0:
                return float('inf')
            if row == 0 and col == 0:
                return grid[0][0]
            return min(
                dp(row-1, col), 
                dp(row, col-1)
            ) + grid[row][col]
        return dp(rows-1, cols-1)
```

從起點出發向終點出發

```python
class Solution:
    def minPathSum(self, grid: List[List[int]]) -> int:
        rows = len(grid)
        cols = len(grid[0])
        
        @cache
        def dp(row, col):
            # 1. 越界檢查 (Boundary Check)
            # 如果走出了網格 (列或行超過範圍)，代表這條路不通
            # 回傳無限大，這樣 min() 就絕對不會選到這條路
            if row >= rows or col >= cols:
                return float('inf')
            
            # 2. 終點條件 (Base Case)
            # 如果到達右下角，就不需要再往後走了
            # 剩下的成本就是格子本身的數值
            if row == rows - 1 and col == cols - 1:
                return grid[row][col]
            
            # 3. 遞迴邏輯 (Recursive Step)
            # 目前這格的成本 + min(往下走的總成本, 往右走的總成本)
            future_min_cost = min(dp(row + 1, col), dp(row, col + 1))
            
            return grid[row][col] + future_min_cost

        # 從左上角 (0, 0) 開始出發
        return dp(0, 0)
```

## 自底向上

```python
class Solution:
    def minPathSum(self, grid: List[List[int]]) -> int:
        rows = len(grid)
        cols = len(grid[0])

        memo = [[-1] * cols for _ in range(rows)]
        memo[rows-1][cols-1] = grid[rows-1][cols-1]

        for row in reversed(range(rows-1)):
            memo[row][cols-1] = memo[row+1][cols-1] + grid[row][cols-1]
        for col in reversed(range(cols-1)):
            memo[rows-1][col] = memo[rows-1][col+1] + grid[rows-1][col]
        print(memo)
        for row in reversed(range(rows-1)):
            for col in reversed(range(cols-1)):
                memo[row][col] = min(memo[row+1][col], memo[row][col+1]) + grid[row][col]

        return memo[0][0]
```
```python
class Solution:
    def minPathSum(self, grid: List[List[int]]) -> int:
        rows = len(grid)
        cols = len(grid[0])
        memo = [[-1] * cols for _ in range(rows)]
        memo[0][0] = grid[0][0]
        for row in range(1, rows):
            memo[row][0] = memo[row-1][0] + grid[row][0]
        for col in range(1, cols):
            memo[0][col] = memo[0][col-1] + grid[0][col]

        for row in range(1, rows):
            for col in range(1, cols):
                memo[row][col] = min(memo[row-1][col], memo[row][col-1]) + grid[row][col]

        return memo[rows-1][cols-1]
```