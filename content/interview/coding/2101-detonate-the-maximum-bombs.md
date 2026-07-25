---
slug: "2101-detonate-the-maximum-bombs"
section: "coding"
title: "2101. Detonate the Maximum Bombs"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1761541448
updated_at: 1761541480
published_at: 1761541448
---
[2101\. Detonate the Maximum Bombs](https://leetcode.com/problems/detonate-the-maximum-bombs/)

```python

class Solution:
    def maximumDetonation(self, bombs: List[List[int]]) -> int:
        n = len(bombs)
        
        # 建立有向圖：i -> j 表示 i 的半徑可引爆 j
        g = [[] for _ in range(n)]
        for i in range(n):
            x1, y1, r1 = bombs[i]
            r1sq = r1 * r1
            for j in range(n):
                if i == j:
                    continue
                x2, y2, _ = bombs[j]
                dx = x1 - x2
                dy = y1 - y2
                if dx*dx + dy*dy <= r1sq:
                    g[i].append(j)
        
        # 以每個節點作為起點，BFS/DFS 一次，取最大可達數
        ans = 0
        for start in range(n):
            visited = set([start])
            q = deque([start])
            count = 0
            while q:
                u = q.popleft()
                count += 1
                for v in g[u]:
                    if v not in visited:
                        visited.add(v)
                        q.append(v)
            ans = max(ans, count)
        
        return ans
```