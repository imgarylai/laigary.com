---
slug: "1306-jump-game-iii"
section: "coding"
title: "1306. Jump Game III"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1761539772
updated_at: 1761539808
published_at: 1761539772
---
[1306\. Jump Game III](https://leetcode.com/problems/jump-game-iii/)

```python
class Solution:
    def canReach(self, arr: List[int], start: int) -> bool:
        
        q = deque([start])
        visited = set()
        visited.add(start)
        
        directions = [1, -1]
        
        while q:
            size = len(q)
            node = q.popleft()
            if arr[node] == 0:
                return True
            for d in directions:
                nextPos = node + arr[node]*d
                if 0 <= nextPos < len(arr) and nextPos not in visited:
                    q.append(nextPos)
                    visited.add(nextPos)
        
        return False
```