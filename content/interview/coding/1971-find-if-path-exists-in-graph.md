---
slug: "1971-find-if-path-exists-in-graph"
section: "coding"
title: "1971. Find if Path Exists in Graph"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1674972900
updated_at: 1708581572
published_at: 1674972900
---
[1971\. Find if Path Exists in Graph](https://leetcode.com/problems/find-if-path-exists-in-graph/)

這個題目有兩個地方要注意，圖形的任兩個節點之間是雙向的，接著就是要選擇要使用深度優先還是廣度優先的搜索。

## 廣度優先

```python
class Solution:
    def validPath(self, n: int, edges: List[List[int]], source: int, destination: int) -> bool:
        graph = collections.defaultdict(list)
        for a, b in edges:
            graph[a].append(b)
            graph[b].append(a)
        
        # Store all the nodes to be visited in 'queue'.
        visited = set()
        visited.add(source)
        queue = deque([source])
    
        while queue:
            curr = queue.popleft()
            if curr == destination:
                return True

            for child in graph[curr]:
                if child not in visited:                
                    visited.add(child)
                    queue.append(child)
        
        return False
```

## 深度優先

```python
class Solution:
    def validPath(self, n: int, edges: List[List[int]], source: int, destination: int) -> bool:
        if not edges:
            return source == destination

        table = defaultdict(list)
        for edge in edges:
            table[edge[0]].append(edge[1]) 
            table[edge[1]].append(edge[0])

        visited = set()
        
        def dfs(curr):
            if curr == destination:
                return True
            for node in table[curr]:
                if node not in visited:
                    visited.add(node)
                    if dfs(node):
                        return True
            return False
        
        return dfs(source)
```