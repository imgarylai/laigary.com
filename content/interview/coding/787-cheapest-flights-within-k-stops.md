---
slug: "787-cheapest-flights-within-k-stops"
section: "coding"
title: "787. Cheapest Flights Within K Stops"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Dynamic Programming", "Graph"]
created_at: 1708929712
updated_at: 1709443386
published_at: 1708929712
---
[787\. Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/)

這一題的考點

1.  在 BFS 時，能不能紀錄到至今為止，現在已經飛了幾個航點（以樹來說，就是已經飛了幾層樹）。
2.  類似動態規劃的記憶法，當我們在航站 A 時，可能有來自不同地方的航點可以飛抵這裡，我們需要知道的是到底從哪個航站飛到當前這個航站的成本是最低的。

```python
class Solution:
    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:    
        graph = defaultdict(list)

        for flight in flights:
            graph[flight[0]].append((flight[1], flight[2]))
        

        queue = deque([(src, 0, k)])
        total_cost = [float(inf)] * n  
        while queue:
            root, cost, stops = queue.popleft()
            for node, price in graph[root]:
                if price + cost < total_cost[node]:
                    total_cost[node] = price + cost
                    if stops > 0:
                        queue.append((node, cost + price, stops - 1))    

        return -1 if total_cost[dst] == float(inf) else total_cost[dst]        
```