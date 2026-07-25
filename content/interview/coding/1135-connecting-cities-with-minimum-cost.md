---
slug: "1135-connecting-cities-with-minimum-cost"
section: "coding"
title: "1135. Connecting Cities With Minimum Cost"
status: "published"
pinned: false
tags: ["Graph", "Heap", "UnionFind"]
created_at: 1674972899
updated_at: 1674972899
published_at: 1674972899
---
[1135\. Connecting Cities With Minimum Cost](https://leetcode.com/problems/connecting-cities-with-minimum-cost/)

這一題題目給的標籤是中等難度，不過應該算是偏向困難的中等題目，算是進階版的廣度優先搜索題目。

這一個題目我會建議先去想題目要問的是什麼，再去理解原來這個題目是想要考哪一個演算法的概念。

這個題目要問的是，現在在一個城市規劃中，有幾座城市其中相鄰的距離不同，我們要怎麼樣去連接每座城市且總共的距離最短，「不過」很抱歉的是，有些城市無法相連，如果是這樣的情況，就回傳 `-1` 。

{% hint style="info" %} 第一個困難點，一般的樹的題目，不論是 DFS 或是 BFS ，我們很少需要考慮的是樹之間沒有連結，不過這一個題目算是無向圖的題目，而圖之間是有可能沒有路徑的。 {% endhint %}

到了這裡，先想想看我們會需要什麼樣的資料結構？

第一個一定是如何快速的往返各個城市，這樣用一個二維陣列或是 Hash Table 就可以做到，不過，我們在旅行前，還要知道距離為何，所以在存入資訊的時候，要記得把 cost 也要記錄起來，這裡我是用 Hash Table 的方式來做。

{% hint style="info" %} 第二個困難點，Hash Table 簡單到中等的題目，多數只會記錄一個數值，這裡要想得到要同時紀錄目的地與成本 {% endhint %}

接下來我們要決定從哪裡出發，我們可以選擇從 1 或是 n 出發都可以，到了這裡，都沒有太大的問題，不過接下來，我們要怎麼完成「去連接每座城市且總共的距離最短」？

要連結所有的城市且距離最短，我們先不要從出發點開始想，假設我們連結了一些城市了，這些城市都已經確定是最短距離的方式連結了，但是還有很多城市需要連結在一起，我們會怎麼選擇這些城市？我們會從現在可以連結的城市中，找到下一個最短連結距離的城市連接起來就好，這是可以被[證明](https://web.stanford.edu/class/archive/cs/cs161/cs161.1138/lectures/14/Small14.pdf) 。

{% hint style="info" %} 第三個困難點，這個定理很好理解，但是不好證明。 {% endhint %}

到了這裡，如果可以理解上面的這個觀念，剩下的題目就變成了 BFS 的變形，我們先從一個點出發，看看他周圍的城市，並且朝周圍的城市去探索，只是這個探索的過程，我們從 queue 換成了 heap ，將周圍的城市以及連結的成本，放入到 heap 裡面，接下來就不斷的把連結成本最小的城市連結起來，並且計算總共的連結成本，這裡因為每個城市之間都有很多的連結，我們只要把每個城市都至少走訪一遍就好，就可以完成題目的需求，**最後就是判斷我們是否走訪了每座城市？**如果沒有，那就代表有城市沒有相連，有的話就回傳總共的成本。

```python
class Solution:
    def minimumCost(self, n: int, connections: List[List[int]]) -> int:
        table = defaultdict(list)
        for city1, city2, cost in connections:
            table[city1].append((cost, city2))
            table[city2].append((cost, city1))
        heap = []
        heapq.heappush(heap, (0, 1))
        seen = set()
        total = 0
        while heap and len(seen) < n:
            cost, city = heapq.heappop(heap)
            if city not in seen:
                seen.add(city)
                total += cost
                for neighbor_cost, neighbor in table[city]:
                    heapq.heappush(heap, (neighbor_cost, neighbor))
        return total if len(seen) == n else -1

```