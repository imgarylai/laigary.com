---
slug: "433-minimum-genetic-mutation"
section: "coding"
title: "433. Minimum Genetic Mutation"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Graph"]
created_at: 1761539246
updated_at: 1761539269
published_at: 1761539246
---
[433\. Minimum Genetic Mutation](https://leetcode.com/problems/minimum-genetic-mutation/)

```python
class Solution:
    def minMutation(self, startGene: str, endGene: str, bank: List[str]) -> int:
        
        mutation = ["A", "T", "C", "G"]
        
        bank = set(bank)
        
        visited = set()
        q = deque([(startGene, 0)])
        visited.add(startGene)
        
        
        while q:
            size = len(q)
            node, steps = q.popleft()
            if node == endGene:
                return steps
            for gene in mutation:
                for i in range(len(node)):
                    neighbor = node[:i] + gene + node[i+1:]
                    if neighbor in bank and neighbor not in visited:
                        q.append((neighbor, steps + 1))
                        visited.add(neighbor)
        
        return -1
        
```