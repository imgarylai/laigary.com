---
slug: "1202-smallest-string-with-swaps"
section: "coding"
title: "1202. Smallest String With Swaps"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1708904717
updated_at: 1708916721
published_at: 1708904717
---
[1202\. Smallest String With Swaps](https://leetcode.com/problems/smallest-string-with-swaps/)

這個題目難在要怎麼想到使用 Graph 的實作來做。

題目給定的 `pairs` 的作用是 `pair` 上兩個座標上的單字可以交換，而且可以無限次數的進行交換，既然題目有給定是無限次數的進行交換，可以去思考為什麼需要這樣的條件，其實這件事情滿好推導的，題目的目的是有連接的 `pairs` 們在交換後，這些連接的字元要符合 lexicographically smallest string（字典排序） ，也就是說因為可以有無限次的交換，所以不管怎麼樣，這些字元最終一定可以依照字典排序的方式來排序（每次兩兩比較，為泡泡排序法）。

可是這個題目其實並不是要考排序，這個題目的下一個困難點是，並不是所有的字元都有被連接的，只有有連接的字元，是需要按照字典排序法的方式排的，所以最後答案的字串每個字元並沒有按照字典排序。

面試時如果稍微仔細分析題目，透過以上的觀察，可以慢慢推導出使用 graph 來處理。

1.  首先先找出哪幾個字是一個 Group ，有點像是 [323](/interview/coding/323-number-of-connected-components-in-an-undirected-graph), [547](/interview/coding/547-number-of-provinces) 的方法，但是比較特別的是要記錄每一個 Group/Island 有哪些節點。
2.  利用任意兩個點可以無限次交換的特性，這是一個 bubble sort 的形式去排序每個字元，但是 Bubble sort 是比較沒有效率的排序方法，可以使用程式內建的排序，去排出字典排序，此時把每個 Group 的字元都排序好。
3.  接著這些 Group 在原先陣列的位置也會知道，如果排序好之後，只要把每個字元替換掉原先陣列有的字元，這樣就可以得到答案。

```python
class Solution:
    def smallestStringWithSwaps(self, s: str, pairs: List[List[int]]) -> str:
        
        ans = list(s)
        
        graph = defaultdict(list)
        
        for pair in pairs:
            graph[pair[0]].append(pair[1])
            graph[pair[1]].append(pair[0])
        
        visited = set()
        
        def dfs(curr, island):
            visited.add(curr)
            island.append(curr)
            for node in graph[curr]:
                if node not in visited:
                    dfs(node, island)
        
        for i in range(len(s)):
            if i not in visited:
                island = []
                dfs(i, island)
                tmp = []
                for node in island:
                    tmp.append(ans[node])
                tmp.sort()
                island.sort()
                for i in range(len(island)):
                    node = island[i]
                    ans[node] = tmp[i]
        
        return ''.join(ans)
                
```