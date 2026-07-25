---
slug: "1490-clone-n-ary-tree"
section: "coding"
title: "1490. Clone N-ary Tree"
status: "published"
pinned: false
tags: ["Classic", "Tree"]
created_at: 1674973114
updated_at: 1709105132
published_at: 1674973114
---
[1490\. Clone N-ary Tree](https://leetcode.com/problems/clone-n-ary-tree/)

這個題目是樹，題目要考察是否可以寫出遍歷整棵樹的程式碼，類似的題目是 [133\. Clone Graph](/interview/coding/133-clone-graph) 的，但是該題有其他要注意的地方。

## 廣度優先搜索

```python
"""
# Definition for a Node.
class Node:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children if children is not None else []
"""

class Solution:
    def cloneTree(self, root: 'Node') -> 'Node':

        if not root:
            return None

        head = Node(root.val)
        queue = deque([(root, head)])

        while queue:
            node, clone = queue.popleft()
            children = []
            for child in node.children:
                tmp = Node(child.val)
                children.append(tmp)
                queue.append((child, tmp))
            clone.children = children
        
        return head

```

## 深度優先搜索

```python
"""
# Definition for a Node.
class Node:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children if children is not None else []
"""

class Solution:
    def cloneTree(self, root: 'Node') -> 'Node':

        if not root:
            return root

        def dfs(curr, clone):
            if not curr:
                return None
            for child in curr.children:
                clone_child = Node(child.val, [])
                clone.children.append(dfs(child, clone_child))
            return clone
        
        head = Node(root.val)
        return dfs(root, head)
```