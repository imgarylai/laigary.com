---
slug: "1466-reorder-routes-to-make-all-paths-lead-to-the-city-zero"
section: "coding"
title: "1466. Reorder Routes to Make All Paths Lead to the City Zero"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1710007354
updated_at: 1710027021
published_at: 1710007354
---
[1466\. Reorder Routes to Make All Paths Lead to the City Zero](https://leetcode.com/problems/reorder-routes-to-make-all-paths-lead-to-the-city-zero/)

這個題目是個滿好的面試題目，題目給定了一個每個城市之間是如何連結的，以及連結的方向，要問如何在現行的城市道路中，把最少的道路改方向，可以讓每個城市都可以通到城市 `0` 。

這個題目的解題思路真的滿難想的，可以用比較極端的例子來思考這個題目，假設今天所有的城市都是從 `0` 開始向外輻射的，這樣的情況就是每個道路都需要改方向，反之就是如果所有的城市都已經有向 `0` 方向的道路了，那我們就不需要改變道路的方向。

而題目給的表達式，其實是具有方向性的，我們就可以利用這個方向性，來完成這個題目。

用一個例子：如果今天有三個城市 `[0, 1, 2]` ，題目中有一個連結是 `[1, 2]` 這樣就代表的是城市 `1` 和 城市 `2` 是由 `1` 往 `2` 的方向，要滿足題目的條件的話，那就是我們需要改變方向。但是如果今天這個連結的表達式是 `[2, 1]` 的話，就表達是城市 `2` 往城市 `1` 的方向，並不需要改方向。

在這樣的情況下，可以這樣想：如果從 `0` 開始遍歷整棵樹時，從 `0` 到 `2` 的情況，題目會是給定上述的哪種方式，如果是 `[1, 2]` 那就需要改方向，如果是 `[2, 1]` 就不需要改方向。

這樣可以在建立該樹的圖形時，題目給定順向方向，在樹的遍歷時，是需要改變方向的，題目如果給定的是逆向方向，在樹的遍歷時，已經滿足題目的條件，是不需要改變方向的。

自此可以用建立無向圖的方式建立起整棵樹，並且設定上述的條件，最後使用 DFS 或是 BFS 來遍歷整棵樹，如果遇到順向的方向，就需要改變方向，把需要改變方向的計數器加一，最後就可以得到題目所問的數字。

```python 
class Solution:

    def minReorder(self, n: int, connections: List[List[int]]) -> int:

        self.res = 0
        graph = defaultdict(list)
        for connection in connections:
            graph[connection[0]].append((connection[1], 1))
            graph[connection[1]].append((connection[0], 0))

        visited = set()
        def dfs(root):
            visited.add(root)
            for node, sign in graph[root]:
                if node not in visited:
                    self.res += sign
                    dfs(node)
        dfs(0)
        return self.res
```