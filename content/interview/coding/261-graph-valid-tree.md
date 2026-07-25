---
slug: "261-graph-valid-tree"
section: "coding"
title: "261. Graph Valid Tree"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph", "Tree"]
created_at: 1674972936
updated_at: 1707980546
published_at: 1674972936
---
[261\. Graph Valid Tree](https://leetcode.com/problems/graph-valid-tree/)

題目給定一個數字 `n` 和一個陣列，`n` 代表的是一個圖中，所用有的節點數量，陣列的每個項目表達的是哪兩個節點相連結，題目要問的是這個圖究竟是不是一棵樹？

在回答這個問題之前，需要先確定幾件事情，確認這些事情是很重要的，因為這會影響題目如何做決策。

這個圖要成為一棵樹的條件如下

1.  這個圖不會任意有節點形成封閉的環 (Ring) ，而當這個圖形沒有環的時候，其實可以把任意一個點當作樹的根節點，剩下的節點就可以變成子樹了。
2.  題目並沒有提到，但是在面試時需要想到的是，題目給定的 `n` ，是不是所有的節點都有相連？這個意思就是，有一種情況是，這個圖並沒有環出現，但是其圖形是兩個樹，在這個題目中這樣是不行的。

這個題目透過圖形的深度優先搜索，其實要找出是否有環並不困難，這就很像是 [141\. Linked List Cycle](/interview/coding/141-linked-list-cycle) ，這個題目就是當站在某一個節點，並往他相鄰的所有節點不斷的探索，如果發現造訪過同樣的一個節點，代表就有環出現了。

在 Linked List 的資料結構中，要找出環很方便是因為 Linked List 具有一定的方向性，但是這個題目給定的是哪兩個節點互相連接，會變得很難確定出方向，所以題目給定的表達式，我自己會想要先轉換成一個比較方便的形式來處理。

我自己選擇的是把這個表達式改成用 Hash Table 的方式來儲存，這樣的好處是什麼？當查到某個節點時，可以知道該節點有哪些子節點，而當造訪子節點時，可以夠過 Hash Table 的方式來進而去遍歷該子樹，這恰恰也是這個題目所問，如果可以遍歷所有的子樹跟節點，那就是一個完整的樹，如果在遍歷的過程中，發現重複造訪相同的子樹，就代表環存在於此圖形中。

第二個要思考的問題是，想要知道方向，但是題目給定的條件其實我們並不知道方向，我在這裡也卡滿久的，那就是在建立這個 Hash Table 的時候，究竟是第一個數字我們要當作 key 然後第二個數字當作子樹的節點，還是第二個數字當作 key ，然後把第一個數字當作子樹的節點？

```python
class Solution:
    def validTree(self, n: int, edges: List[List[int]]) -> bool:
        
        graph = defaultdict(list)
        
        for edge in edges:
            n1, n2 = edge
            graph[n1].append(n2)
            graph[n2].append(n1)
        
        seen = set()
        
        def dfs(node, parent):
            if node in seen:
                return None
            seen.add(node)
            for adj in graph[node]:
                if adj == parent:
                    continue
                if adj in seen:
                    return False
                res = dfs(adj, node)
                if not res:
                    return False
            return True
        
        return dfs(0, -1) and len(seen) == n
            
```