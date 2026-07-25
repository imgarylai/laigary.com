---
slug: "289-game-of-life"
section: "coding"
title: "289. Game of Life"
status: "published"
pinned: false
tags: []
created_at: 1761525931
updated_at: 1761526297
published_at: 1761525931
---
[289\. Game of Life](https://leetcode.com/problems/game-of-life/)

題目並不難，這只是屬於更大型的 [Graph](/interview/coding?tag=Graph) Traversal 的題目，並且同時要往八個方位去行走，值得注意的是，不能邊更遍歷原先 `board` 並更新值，因為這樣會導致 `state` 的不穩定，需要先暫存一個 snapshot 來做參照。

接著只需要按照規則把邏輯實作出來就好，我的第一個版本如下。

```python
class Solution:
    def gameOfLife(self, board: List[List[int]]) -> None:
        """
        Do not return anything, modify board in-place instead.
        """
        rows = len(board)
        cols = len(board[0])

        grid = [[0 for _ in range(cols)] for _ in range(rows)]

        for row in range(rows):
            for col in range(cols):
                grid[row][col] = board[row][col]
        
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]

        for row in range(rows):
            for col in range(cols):
                live = 0
                dead = 0
                if grid[row][col] == 1: # live
                    for dr, dc in directions:
                        newR = row + dr
                        newC = col + dc
                        if 0 <= newR < rows and 0 <= newC < cols:
                            if grid[newR][newC] == 1:
                                live += 1
                            if grid[newR][newC] == 0:
                                dead += 1
                    if live < 2 or live > 3:
                        board[row][col] = 0
                else: # dead    
                    for dr, dc in directions:
                        newR = row + dr
                        newC = col + dc
                        if 0 <= newR < rows and 0 <= newC < cols:
                            if grid[newR][newC] == 1:
                                live += 1
                    if live == 3:
                        board[row][col] = 1
```

上面這個邏輯的做法是把 live & dead 分開處理，但是寫完後可以進一步優化，先去紀錄每個鄰近的點的狀態。時間複雜度相同，只是把邏輯精簡一下。

```python
class Solution:
    def gameOfLife(self, board: List[List[int]]) -> None:
        """
        Do not return anything, modify board in-place instead.
        """
        rows = len(board)
        cols = len(board[0])

        grid = [[0 for _ in range(cols)] for _ in range(rows)]

        for row in range(rows):
            for col in range(cols):
                grid[row][col] = board[row][col]
        
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]

        for row in range(rows):
            for col in range(cols):
                live = 0
                dead = 0
                for dr, dc in directions:
                    newR = row + dr
                    newC = col + dc
                    if 0 <= newR < rows and 0 <= newC < cols:
                        if grid[newR][newC] == 1:
                            live += 1
                        if grid[newR][newC] == 0:
                            dead += 1
                if grid[row][col] == 1: # live
                    if live < 2 or live > 3:
                        board[row][col] = 0
                else: # dead    
                    if live == 3:
                        board[row][col] = 1
```

時間複雜度是 $ O(n^2) $ ，空間複雜度也是 $ O(n^2) $。