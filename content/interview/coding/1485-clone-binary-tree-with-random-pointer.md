---
slug: "1485-clone-binary-tree-with-random-pointer"
section: "coding"
title: "1485. Clone Binary Tree With Random Pointer"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973112
updated_at: 1674973112
published_at: 1674973112
---
[1485\. Clone Binary Tree With Random Pointer](https://leetcode.com/problems/clone-binary-tree-with-random-pointer/)

概念和 [138\. Copy List with Random Pointer](/interview/coding/138-copy-list-with-random-pointer) 一模一樣。

```python
# Definition for Node.
# class Node:
#     def __init__(self, val=0, left=None, right=None, random=None):
#         self.val = val
#         self.left = left
#         self.right = right
#         self.random = random

class Solution:
    def copyRandomBinaryTree(self, root: 'Node') -> 'NodeCopy':
        if not root:
            return None
        table = {}
        copy = NodeCopy(root.val)
        table[root] = copy

        queue = deque([(root, copy)])
        while queue:
            node, copy_node = queue.popleft()
            if node.left:
                copy_node.left = NodeCopy(node.left.val)
                table[node.left] = copy_node.left
                queue.append((node.left, copy_node.left))
            if node.right:
                copy_node.right = NodeCopy(node.right.val)
                table[node.right] = copy_node.right
                queue.append((node.right, copy_node.right))

        queue = deque([root])

        while queue:
            node = queue.popleft()
            if node.random:
                random = table[node.random]
                table[node].random = random
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        return table[root]

```