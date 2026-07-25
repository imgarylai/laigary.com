---
slug: "329-longest-increasing-path-in-a-matrix"
section: "coding"
title: "329. Longest Increasing Path in a Matrix"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674948739
updated_at: 1720412598
published_at: 1674948739
---
[329\. Longest Increasing Path in a Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/)

💡

在做這個題目之前可以先完成 [200\. Number of Islands](/interview/coding/200-number-of-islands)

這個題目需要分成兩個階段來思考。

第一個階段是，題目所求的最長遞增路徑是可以從任意點出發的，當任選一個點出發後，該次旅程不能重複造訪其他點，因此需要遍歷每個點來找到最大值，遍歷的方式很簡單，並且搭配 DFS 就可以完成。

第二個部分是，在遍歷每個點去找出最大值的時候，可以觀察出另一件事情，那就是在找到最大值的路上，會有很多重複的路徑。

例如，當前位置的值是 8 ，他的周圍有 7 和 9 ，根據題目設定，會前往去 9 的位置。既然 7 和 8 相連，8 也比 7 小，那當位置是在 7 的時候，就可以往 8 走，但是一但走到 8 的時候，如果 8 已經探索完了，只需要繼承走過 8 這個點的記憶就好，因此這個第二階段就是透過動態規劃的記憶法來輔助找尋答案。

1.  深度優先搜索
2.  動態規劃記憶法

```python
class Solution:
    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:
        rows = len(matrix)
        cols = len(matrix[0])
        ans = defaultdict(int)
        directions = [(1, 0), (0, 1), (-1, 0), (0, -1)]

        def findMax(row, col):
            if (row, col) in ans:
                return ans[(row, col)]
            for dr, dc in directions:
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols and matrix[nr][nc] > matrix[row][col]:
                    ans[(row, col)] = max(ans[(row, col)], findMax(nr, nc))
            # 需要在後面補一，如果先補一的話，有可能在 findMax 遞迴中，會撞上 Base case ，造成計算錯誤。
            ans[(row, col)] += 1
            return ans[(row, col)]

        for row in range(rows):
            for col in range(cols):
                findMax(row, col)
        print(ans)
        return max(ans.values())
```