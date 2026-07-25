---
slug: "286-walls-and-gates"
section: "coding"
title: "286. Walls and Gates"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Graph"]
created_at: 1674972936
updated_at: 1709533414
published_at: 1674972936
---
[286\. Walls and Gates](https://leetcode.com/problems/walls-and-gates/)

題目給定一個矩陣，矩陣內有標記了牆與門，剩餘的點被標註成一個無限大的數值，意義為可以行走的點，要求把這些矩陣中除了門與牆以外的點，以該點到達附近最近的門的距離為何？

這個題目與 [1091\. Shortest Path in Binary Matrix](/interview/coding/1091-shortest-path-in-binary-matrix) 很類似，要矩陣中有牆與路，要找出最短路線，在該題中，題目有設定好起點與終點的位置，所以可以使用廣度優先搜索的方式，逐步找出最短路徑。

雖然與 1091 題類似，但是我們不能使用 1091 的方法來做，因為這樣會使我們要遍歷每一個點後，才能完全證明所有的點都更新成了最短路徑的數值。而這樣的做法其實會有很多不必要的計算，例如從 A 點到 B 點，只有一條路線時，行經中間的點 k 其已經知道其到 B 的最短路徑是 A 到 B 的距離，減去 A 到 k 的距離。

所以這個題目可以反著做，直接從門出發，並且通過 BFS 的方式，逐步更新每個點與自己的距離，比較要注意的點是，當我看到下一個前往的點，該點已經有到附近的門的距離的值時，除非我前往這個點的距離，會比他原始的數字小，我才能更新該點，不然的話該點已經存在著一條更短的路徑了。

我一開始的做法是把 BFS 的邏輯抽出來寫如下，但是這樣做會超時，因為其實這樣做除了 BFS 的時間複雜度以外，多數重複的路徑會一直走，像是在第一個門在探索的時候，探索的過程會到非常遠的地方，並確保所有值都被更新後才會停止，但是因為很多的點已經距離很遠了，其他的門探索的時候很容易又把這些點給更新掉...一直要到後期，才會有機會減少重複探索的次數。

```python
class Solution:
    def wallsAndGates(self, rooms: List[List[int]]) -> None:
        """
        Do not return anything, modify rooms in-place instead.
        """  
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        def bfs(row, col):
            queue = deque()
            queue.append((row, col))
            while queue:
                row, col = queue.popleft()
                for dr, dc in directions:
                    nr = row + dr
                    nc = col + dc
                    if 0 <= nr < rows and 0 <= nc < cols and rooms[nr][nc] > rooms[row][col]:
                        rooms[nr][nc] = rooms[row][col] + 1
                        queue.append((nr, nc))

        rows = len(rooms)
        cols = len(rooms[0])

        for row in range(rows):
            for col in range(cols):
                if rooms[row][col] == 0:
                    bfs(row, col)

```

觀察題目，其實我們並不侷限一定要一個一個門的去探索，在實作 BFS 時，可以把所有的起點一同放在一起，多個點同時出發，同時一起探索，這樣的話速度會快很多，因為更多的點同時被更新了，會減少很多重複探索的情況。

```python
class Solution:
    def wallsAndGates(self, rooms: List[List[int]]) -> None:
        """
        Do not return anything, modify rooms in-place instead.
        """  

        rows = len(rooms)
        cols = len(rooms[0])
        queue = deque()
        for row in range(rows):
            for col in range(cols):
                if rooms[row][col] == 0:
                    queue.append((row, col))

        directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]

        while queue:
            row, col = queue.popleft()
            for dr, dc in directions:
                nr = row + dr
                nc = col + dc
                if 0 <= nr < rows and 0 <= nc < cols and rooms[nr][nc] > rooms[row][col]:
                    rooms[nr][nc] = rooms[row][col] + 1
                    queue.append((nr, nc))

```