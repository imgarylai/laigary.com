---
slug: "102-binary-tree-level-order-traversal"
section: "coding"
title: "102. Binary Tree Level Order Traversal"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Tree"]
created_at: 1674972898
updated_at: 1724112167
published_at: 1674972898
---
[102\. Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/)

## BFS

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def levelOrder(self, root: TreeNode) -> List[List[int]]:        
        if not root:
            return []
        queue = deque([root])
        res = defaultdict(list)
        level = 0
        while queue:
            size = len(queue)
            for i in range(size):
                node = queue.popleft()
                res[level].append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            level += 1

        return res.values()

```

## DFS

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def levelOrder(self, root: TreeNode) -> List[List[int]]:
        res = defaultdict(list)
        if not root:
            return []

        def helper(node, level):     
            if not node:
                return       
            res[level].append(node.val)

            helper(node.left, level + 1)
            helper(node.right, level + 1)

        helper(root, 0)
        return res.values()
```