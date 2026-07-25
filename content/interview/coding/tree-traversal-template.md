---
slug: "tree-traversal-template"
section: "coding"
title: "Tree 遍歷模板"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1784876687
updated_at: 1784876687
published_at: 1784876687
---
樹的題目只要回答兩個問題就能寫：**用哪種遍歷**、**遞迴要回傳什麼給父節點**。

## 四種遍歷

前中後序差別只在「處理節點」那行放在哪裡：

```python
def dfs(node):
    if not node:
        return
    # 前序：先處理自己，再處理子樹（適合「由上往下傳資訊」）
    dfs(node.left)
    # 中序：BST 的中序遍歷 = 遞增序列
    dfs(node.right)
    # 後序：子樹都算完才處理自己（適合「由下往上收集資訊」）
```

層序遍歷用佇列，**一次處理一整層**是關鍵：

```python
from collections import deque

def level_order(root):
    if not root:
        return []
    q, res = deque([root]), []
    while q:
        level = []
        for _ in range(len(q)):      # 先固定這一層的數量
            node = q.popleft()
            level.append(node.val)
            if node.left:  q.append(node.left)
            if node.right: q.append(node.right)
        res.append(level)
    return res
```

例題：[94. Binary Tree Inorder Traversal](/interview/coding/94-binary-tree-inorder-traversal)、[102. Binary Tree Level Order Traversal](/interview/coding/102-binary-tree-level-order-traversal)、[199. Binary Tree Right Side View](/interview/coding/199-binary-tree-right-side-view)

## 後序型：回傳值就是「這棵子樹的答案」

絕大多數樹的中難題都是這一型 — 遞迴函式回傳子樹的某個統計量，父節點拿它來算自己的：

```python
def dfs(node):
    if not node:
        return 0                     # base case 決定了空樹的語意
    left = dfs(node.left)
    right = dfs(node.right)
    return max(left, right) + 1      # 用子樹的答案組出自己的答案
```

例題：[104. Maximum Depth of Binary Tree](/interview/coding/104-maximum-depth-of-binary-tree)、[226. Invert Binary Tree](/interview/coding/226-invert-binary-tree)

### 回傳值 ≠ 答案的情況

有些題目「經過某節點的最佳解」和「能往上傳給父節點的值」是兩件事 — 這時用一個外部變數收答案，回傳值只負責往上傳：

```python
def dfs(node):
    nonlocal ans
    ...
    ans = max(ans, left + right + node.val)   # 經過自己的路徑（不能往上傳）
    return max(left, right) + node.val        # 能延伸給父節點的路徑
```

這個「兩個值分開」的觀念是 Binary Tree Maximum Path Sum 和 Diameter 的核心。

例題：[124. Binary Tree Maximum Path Sum](/interview/coding/124-binary-tree-maximum-path-sum)、[543. Diameter of Binary Tree](/interview/coding/543-diameter-of-binary-tree)

## 前序型：由上往下傳限制

驗證 BST、路徑總和這類題目，資訊要從父節點往下帶：

```python
def dfs(node, low, high):
    if not node:
        return True
    if not (low < node.val < high):
        return False
    return dfs(node.left, low, node.val) and dfs(node.right, node.val, high)
```

只比較「節點和它的左右子」是最經典的錯誤 — BST 的限制是整棵子樹的範圍，不是單一層。

例題：[98. Validate Binary Search Tree](/interview/coding/98-validate-binary-search-tree)

## BST 的特權

看到 BST 就先想「中序遍歷 = 遞增」和「可以像二分搜尋一樣只走一邊」。例如找 LCA，只要值都比節點小就往左，都比節點大就往右，不必搜整棵樹。

例題：[235. Lowest Common Ancestor of a Binary Search Tree](/interview/coding/235-lowest-common-ancestor-of-a-binary-search-tree)、[236. Lowest Common Ancestor of a Binary Tree](/interview/coding/236-lowest-common-ancestor-of-a-binary-tree)

## 面試時的講法

先說「我用後序遍歷，遞迴回傳 X」，把 X 的定義講清楚 — 這一句就決定了整個解法，講對了 code 是順的，講不出來代表還沒想清楚。遞迴的空間複雜度是 $O(h)$（樹高），不平衡時退化成 $O(n)$，主動提出來會加分。

其他例題：[297. Serialize and Deserialize Binary Tree](/interview/coding/297-serialize-and-deserialize-binary-tree)、[100. Same Tree](/interview/coding/100-same-tree)

更多題目 → [#Tree](/interview/coding?tag=Tree)
