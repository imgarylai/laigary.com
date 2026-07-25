---
slug: "bfs-dfs-template"
section: "coding"
title: "BFS / DFS 模板"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Depth-First Search", "Graph"]
created_at: 1784876687
updated_at: 1784876687
published_at: 1784876687
---
圖的題目第一步永遠是翻譯：**節點是什麼、邊是什麼**。翻譯完之後，選 BFS 還是 DFS 只看一件事 — 要不要最短。

## BFS：逐層擴散，第一次到達就是最短

```python
from collections import deque

def bfs(start):
    q = deque([start])
    seen = {start}               # 進佇列時就標記，不是出佇列時
    steps = 0
    while q:
        for _ in range(len(q)):  # 一次處理一整層
            node = q.popleft()
            if node == target:
                return steps
            for nxt in neighbors(node):
                if nxt not in seen:
                    seen.add(nxt)
                    q.append(nxt)
        steps += 1
    return -1
```

**進佇列時就標記已訪問**是最常見的 bug 來源 — 出佇列才標記的話，同一個節點會被重複塞進佇列。

例題：[1091. Shortest Path in Binary Matrix](/interview/coding/1091-shortest-path-in-binary-matrix)、[127. Word Ladder](/interview/coding/127-word-ladder)

### 多源 BFS

「所有起點同時開始擴散」時，把全部起點一次放進初始佇列就好，其他完全一樣：

```python
    q = deque(所有起點)
    seen = set(所有起點)
```

例題：[994. Rotting Oranges](/interview/coding/994-rotting-oranges)

## DFS：走到底再回頭，適合連通性與計數

```python
def dfs(r, c):
    if not (0 <= r < m and 0 <= c < n) or grid[r][c] != '1':
        return
    grid[r][c] = '0'                 # 標記已訪問（就地改，省一個 visited）
    for dr, dc in ((1,0), (-1,0), (0,1), (0,-1)):
        dfs(r + dr, c + dc)
```

網格題把「越界」和「不該走」合併成一個 guard 寫在函式開頭，比在呼叫前判斷乾淨得多。遞迴深度可能到 $O(mn)$，面試時可以主動提「資料再大我會改成顯式的 stack」。

例題：[200. Number of Islands](/interview/coding/200-number-of-islands)、[79. Word Search](/interview/coding/79-word-search)、[547. Number of Provinces](/interview/coding/547-number-of-provinces)

## 拓撲排序：有依賴關係就是它

「先修課程」「建置順序」這類題目，本質是問有向圖有沒有環：

```python
from collections import deque

indegree = [0] * n
graph = [[] for _ in range(n)]
for a, b in edges:               # b -> a（先做 b 才能做 a）
    graph[b].append(a)
    indegree[a] += 1

q = deque([i for i in range(n) if indegree[i] == 0])
order = []
while q:
    node = q.popleft()
    order.append(node)
    for nxt in graph[node]:
        indegree[nxt] -= 1
        if indegree[nxt] == 0:   # 所有前置都完成了才入列
            q.append(nxt)

return order if len(order) == n else []   # 長度不足代表有環
```

最後那行的長度檢查就是判環，別忘了。

例題：[207. Course Schedule](/interview/coding/207-course-schedule)、[210. Course Schedule II](/interview/coding/210-course-schedule-ii)

## 需要複製結構時：用 map 記錄「舊 → 新」

Clone 類題目的關鍵是**先建節點、放進 map，再遞迴處理鄰居**，否則有環時會無限遞迴：

```python
def clone(node):
    if node in old_to_new:
        return old_to_new[node]
    copy = Node(node.val)
    old_to_new[node] = copy          # 必須在遞迴之前放進去
    copy.neighbors = [clone(n) for n in node.neighbors]
    return copy
```

例題：[133. Clone Graph](/interview/coding/133-clone-graph)

## 面試時的講法

先講圖怎麼建（鄰接表？就地用網格？），再講選 BFS 或 DFS 的理由 — 「要最短所以 BFS」「只問連不連通所以 DFS 比較省」。複雜度是 $O(V + E)$，網格題就是 $O(mn)$，講出來代表你知道每個節點只會被訪問一次。

更多題目 → [#Graph](/interview/coding?tag=Graph)
