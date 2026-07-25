---
slug: "841-keys-and-rooms"
section: "coding"
title: "841. Keys and Rooms"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1710219737
updated_at: 1710219808
published_at: 1710219737
---
[841\. Keys and Rooms](https://leetcode.com/problems/keys-and-rooms/)

透過拿到的鑰匙來造訪後面的房間，是圖形搜索的一種問題。

```python
class Solution:
    def canVisitAllRooms(self, rooms: List[List[int]]) -> bool:
        visited = set()
        visited.add(0)
        queue = deque([0])

        while queue:
            room = queue.popleft()
            for key in rooms[room]:
                if key not in visited:
                    visited.add(key)
                    queue.append(key)
        
        return len(visited) == len(rooms)
```