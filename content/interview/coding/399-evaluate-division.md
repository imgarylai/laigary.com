---
slug: "399-evaluate-division"
section: "coding"
title: "399. Evaluate Division"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1708924026
updated_at: 1708924052
published_at: 1708924026
---
[399\. Evaluate Division](https://leetcode.com/problems/evaluate-division/)

```python
class Solution:
    def calcEquation(self, equations: List[List[str]], values: List[float], queries: List[List[str]]) -> List[float]:
        
        graph = defaultdict(list)
        nodes = set()
        for i in range(len(equations)):
            equation = equations[i]
            value = values[i]
            graph[equation[0]].append((equation[1], value))
            graph[equation[1]].append((equation[0], 1.0 / value))
            nodes.add(equation[0])
            nodes.add(equation[1])
        
        
        def dfs(curr, end, prev, visited):
            if curr not in nodes or end not in nodes:
                return -1
            if curr == end:
                return prev
            visited.add(curr)
            for node in graph[curr]:
                if node[0] not in visited:
                    tmp = dfs(node[0], end, node[1] * prev, visited)
                    if tmp != -1:
                        return tmp
            return -1
        
        res = []
        
        for query in queries:
            res.append(dfs(query[0], query[1], 1, set()))
            
        return res
```