---
slug: "752-open-the-lock"
section: "coding"
title: "752. Open the Lock"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Graph"]
created_at: 1674972897
updated_at: 1709523212
published_at: 1674972897
---
[752\. Open the Lock](https://leetcode.com/problems/open-the-lock/)

```python
class Solution:
    def openLock(self, deadends: List[str], target: str) -> int:        

        visited = set()
        for deadend in deadends:
            visited.add(deadend)

        root = '0000'

        steps = 0
        queue = deque([root])
        visited.add(root)
        while queue:
            for i in range(len(queue)):
                node = queue.popleft()
                if node in deadends:
                    continue
                if node == target:
                    return steps
                for i in range(4):
                    plus_one = '0' if node[i] == '9' else str(int(node[i]) + 1)
                    child = node[:i] + plus_one + node[i+1:]
                    if child not in visited:
                        queue.append(child)
                        visited.add(child)
                    minus_one = '9' if node[i] == '0' else str(int(node[i]) - 1)
                    child = node[:i] + minus_one + node[i+1:]
                    if child not in visited:
                        queue.append(child)
                        visited.add(child)
            steps += 1

        return -1

```
```python
class Solution:

    def generate_keys(self, node):
        keys = []
        for i in range(4):
            plus_one = '0' if node[i] == '9' else str(int(node[i]) + 1)
            minus_one = '9' if node[i] == '0' else str(int(node[i]) - 1)
            keys.append(node[:i] + plus_one + node[i+1:])
            keys.append(node[:i] + minus_one + node[i+1:])
        return keys

    def openLock(self, deadends: List[str], target: str) -> int:         
        visited = set()
        for deadend in deadends:
            visited.add(deadend)

        root = '0000'
        steps = 0
        queue = deque([root])
        visited.add(root)
        while queue:
            for i in range(len(queue)):
                node = queue.popleft()
                if node in deadends:
                    continue
                if node == target:
                    return steps
                for key in self.generate_keys(node):
                    if key not in visited:
                        queue.append(key)
                        visited.add(key)
            steps += 1

        return -1

```