---
slug: "797-all-paths-from-source-to-target"
section: "coding"
title: "797. All Paths From Source to Target"
status: "published"
pinned: false
tags: ["Backtrack", "Depth-First Search", "Graph"]
created_at: 1708582536
updated_at: 1761710866
published_at: 1708582536
---
[797\. All Paths From Source to Target](https://leetcode.com/problems/all-paths-from-source-to-target/)

```python
class Solution:
    def allPathsSourceTarget(self, graph: List[List[int]]) -> List[List[int]]:
        
        dest = len(graph) - 1
        res = []
        
        def backtrack(curr, i):
            if i == dest:
                curr.append(i)
                res.append(curr.copy())
                curr.pop()
                return
            
            curr.append(i)
            for node in graph[i]:
                backtrack(curr, node)    
            curr.pop()
            
        backtrack([], 0)
        
        return res
            
```
```python
class Solution:
    def allPathsSourceTarget(self, graph: List[List[int]]) -> List[List[int]]:
        target = len(graph) - 1
        res = []
        
        def backtrack(i, curr, visited):
            if len(curr) > 0 and curr[-1] == target:
                res.append(curr.copy())
                return
            
            for node in graph[i]:
                if node not in visited:
                    curr.append(node)
                    visited.add(node)
                    backtrack(node, curr, visited)
                    visited.remove(node)
                    curr.pop()
            
        
        backtrack(0, [0], set([0]))
        return res
```
```python
class Solution:
    def allPathsSourceTarget(self, graph: List[List[int]]) -> List[List[int]]:
        target = len(graph) - 1
        res = []
        
        def backtrack(i, curr):
            if len(curr) > 0 and curr[-1] == target:
                res.append(curr.copy())
                return
            
            for node in graph[i]:
                curr.append(node)
                backtrack(node, curr)
                curr.pop()
            
        
        backtrack(0, [0])
        return res
```