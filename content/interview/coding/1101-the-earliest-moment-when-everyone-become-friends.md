---
slug: "1101-the-earliest-moment-when-everyone-become-friends"
section: "coding"
title: "1101. The Earliest Moment When Everyone Become Friends"
status: "published"
pinned: false
tags: ["Graph", "UnionFind"]
created_at: 1708840897
updated_at: 1708841777
published_at: 1708840897
---
[1101\. The Earliest Moment When Everyone Become Friends](https://leetcode.com/problems/the-earliest-moment-when-everyone-become-friends/)

這個題目是我認為很好的一道面試題，因為題目的情景很貼近日常生活，所以很容易放在各種公司產品的情境。

LeetCode 的官方答案是使用 Union Find 來實作，但是我覺得這樣的實作方法很不容易在面試中想到並且解釋的清楚。

我的思考模式是其實很簡單，已知是為兩兩在何時成為朋友，而如果 A 和 B 與 C 都是朋友，其中 A 和 B 在 0 這個時間點成為朋友 B 和 C 在 1 這個時間點成為朋友，A 和 C 在 2 這個時間點成為朋友，也就是說在 1 這個時間點， A、B、C 已經完全連接了，其中雖然最終 A 可以有和 C 的連接，但是透過 DFS 或是 BFS ，只要終究可以造訪完所有節點，就可以確認某個時間點是已經可以全部連結的。

```python
class Solution:
    def earliestAcq(self, logs: List[List[int]], n: int) -> int:
        
        timestamps = [log[0] for log in logs]
        timestamps.sort()
        
        graph = defaultdict(list)
        
        for log in logs:
            graph[log[1]].append((log[2], log[0]))
            graph[log[2]].append((log[1], log[0]))
        
        
        def dfs(curr, visited, timestamp):
            visited.add(curr)
            for node, time in graph[curr]:
                // 兩個人認識的時間要在目前想要確認的時間點之前或是同時，才算是已經是朋友了，這時候才有走 DFS 的必要。
                if node not in visited and time <= timestamp:
                    dfs(node, visited, timestamp)
        
        for timestamp in timestamps:
            visited = set()
            dfs(0, visited, timestamp)
            if len(visited) == n:
                return timestamp
            
        return -1
        
```