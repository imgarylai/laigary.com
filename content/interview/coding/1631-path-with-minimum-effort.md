---
slug: "1631-path-with-minimum-effort"
section: "coding"
title: "1631. Path With Minimum Effort"
status: "published"
pinned: false
tags: ["Binary Search", "Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1761863401
updated_at: 1761875289
published_at: 1761863401
---
[1631\. Path With Minimum Effort](https://leetcode.com/problems/path-with-minimum-effort/)

這個題目算是比較變態的一題，但是絕對是面試時間內做得出來的題目，要會這題一定要先做過 [875\. Koko Eating Bananas](/interview/coding/875-koko-eating-bananas) 並理解特殊型的 [Binary Search](/interview/coding?tag=Binary%20Search)。

題目的設定條件邏輯並不難，乍看之下，看起來是可以使用深度優先搜索外加，或是透過 [Backtrack](/interview/coding?tag=Backtrack) 來實作一些剪枝。我們要找的是 Minimum Effort ，窮舉出所有的路徑就可以找到最小努力的路徑，實作上的難度也是有點困難，因為我們還需要記錄每個 DFS 到底有沒有超過 Efforts 。

這一題的關鍵是需要**「觀察」**到這一點，那就是我們能不能找出需要努力的範圍區間呢？答案是可以的，因為我們知道其實最小的努力值就是 `0` ，這個情況就是從起點到終點，沒有任何的變化（完全是平地），而最大值需要的努力值就是最高地的值。

接著我們要在這個範圍內，找出最小值，這個最小值剛好需要可以從 `(0, 0)` 走到 `(m - 1, n - 1)` 。

因此在 DFS 的過程中，如果我們找到的努力值比較高，我們可以直接縮小更多的搜尋範圍，如果努力值太小，就會沒有辦法完成 DFS ，我們就可以快速的結束搜尋。

```python
class Solution:
    def minimumEffortPath(self, heights: List[List[int]]) -> int:
        
        rows = len(heights)
        cols = len(heights[0])
        directions = [(1, 0), (0, 1), (-1, 0), (0, -1)]
        
        def dfs(row, col, seen, threshold):
            if row == rows - 1 and col == cols - 1:
                return True
            seen.add((row, col))
            for dr, dc in directions:
                nr, nc = row + dr, col + dc
                if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen:
                    if abs(heights[nr][nc] - heights[row][col]) <= threshold:
                        if dfs(nr, nc, seen, threshold):
                            return True
            return False
        

        left = 0
        right = max(max(row) for row in heights)
        while left <= right:
            mid = (left + right) // 2
            if dfs(0, 0, set(), mid):
                right = mid - 1
            else:
                left = mid + 1
        
        return left
```