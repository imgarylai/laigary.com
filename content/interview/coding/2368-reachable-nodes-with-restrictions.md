---
slug: "2368-reachable-nodes-with-restrictions"
section: "coding"
title: "2368. Reachable Nodes With Restrictions"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1743053685
updated_at: 1761433312
published_at: 1743053685
---
[2368\. Reachable Nodes With Restrictions](https://leetcode.com/problems/reachable-nodes-with-restrictions/)

```python
class Solution:
    def reachableNodes(self, n: int, edges: List[List[int]], restricted: List[int]) -> int:
        
        graph = defaultdict(list)
        
        for edge in edges:
            u, v = edge
            graph[u].append(v)
            graph[v].append(u)
            
        visited = set(restricted)
        
        def dfs(source):
            if source in visited:
                return 0
            visited.add(source)
            count = 1
            nodes = graph[source]
            for node in nodes:
                count += dfs(node)
            return count
        
        return dfs(0)
                
```