---
slug: "547-number-of-provinces"
section: "coding"
title: "547. Number of Provinces"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph", "UnionFind"]
created_at: 1674972899
updated_at: 1709438806
published_at: 1674972899
---
[547\. Number of Provinces](https://leetcode.com/problems/number-of-provinces/)

這個題目是有 `n` 個島嶼，其中島嶼可能會相連，我們要知道是不是相連的方式是題目有給定一個 `n x n` 的矩陣，如果矩陣的位置 `i, j` 的值是 1 ，代表`i`和`j` 小島是有相鄰的。

這題我一開始想的方向是，其實題目已經告訴我們相連的方式了，那我就從矩陣一開始的座標 (0, 0) 一個一個走下去，所以我就寫了兩個 for 迴圈如下，我想到的邏輯大致上就是我就開始探索，題目給出的條件也都很明確，我搜尋的路上只要有看到其他的島嶼相連，我就繼續跳過去，再慢慢走。

```python
class Solution:
    def findCircleNum(self, isConnected: List[List[int]]) -> int:
        n = len(isConnected)
        visited = set()
        count = 0
        for i in range(n):
            for j in range(n):
                # 開始走訪各個島嶼
                ...

```

這樣的做法應該也是有辦法做出來的，可是如果一開始就用兩個迴圈，像是我們造訪過哪些「座標」的方式來走訪各個島嶼的話，真的會暈頭轉向。

後來才想到，其實我們要專注的應該是「哪個」島嶼已經被造訪過了，總共只有 `n` 個島嶼需要造訪，所以我們需要的是一個長度 `n` 初始值為 `False` 的陣列。

走訪的規則很簡單，以第一個島嶼為例，如果第一個島嶼的那列 `isConnected[0]`每一個數字都是 1 ，代表的就是一號島嶼跟每個島嶼都相連，那我們就從第一個島嶼出發，往這一列的右邊去走，中間如果發現其他島嶼，就走過去看，然後就回回到跟第一個島嶼一樣的邏輯，繼續出發到沒有島嶼可以探索為止。中間就要記錄我們走訪過哪些島嶼。

## DFS

```python
class Solution:
    def findCircleNum(self, isConnected: List[List[int]]) -> int:
        n = len(isConnected)
        visited = [False] * n
        count = 0
        def dfs(i):
            # 走訪看看島嶼 i 是否與其他島嶼有連結
            for j in range(n):
                # 如果有連結，在之前也還沒看過的話，走過去拜訪
                if isConnected[i][j] == 1 and visited[j] == False:
                    visited[i] = True
                    dfs(j)

        # 走訪每一個島嶼
        for i in range(n):
            if visited[i] == False:
                visited[i] = True
                dfs(i)
                count += 1

        return count

```

時間複雜度：$O(N^2)$

空間複雜度：$O(N)$

## BFS

```python
class Solution:
    def findCircleNum(self, isConnected: List[List[int]]) -> int:
        n = len(isConnected)
        visited = [False] * n
        count = 0
        queue = deque([])
        for i in range(n):
            if visited[i] == False:
                queue.append(i)
                while queue:
                    x = queue.popleft()
                    visited[x] = True
                    for j in range(n):
                        if isConnected[x][j] == 1 and visited[j] == False:
                            queue.append(j)
                count += 1
        return count

```

### UnionFind

最後一種方法需要使用到 [Graph 圖](/interview/coding?tag=Graph) Disjoint Set的觀念

```python
class UnionFind:
    def __init__(self, size: int):
        self.size = size
        self.root = [i for i in range(size)]
    
    def find(self, x):
        return self.root[x]
    
    def union(self, x, y):
        xRoot = self.find(x)
        yRoot = self.find(y)
        if xRoot != yRoot:
            for i in range(self.size):
                if yRoot == self.root[i]:
                    self.root[i] = xRoot

class Solution:
    def findCircleNum(self, isConnected: List[List[int]]) -> int:
        
        n = len(isConnected)
        
        unionFind = UnionFind(n)
        
        for i in range(n):
            for j in range(i + 1, n):
                if isConnected[i][j] == 1:
                    unionFind.union(i, j)
                    
        s = set(unionFind.root)
        return len(s)
```