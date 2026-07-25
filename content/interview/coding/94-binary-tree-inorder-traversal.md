---
slug: "94-binary-tree-inorder-traversal"
section: "coding"
title: "94. Binary Tree Inorder Traversal"
status: "published"
pinned: false
tags: ["Inorder Traversal", "Tree"]
created_at: 1674972936
updated_at: 1699250860
published_at: 1674972936
---
[94\. Binary Tree Inorder Traversal](https://leetcode.com/problems/binary-tree-inorder-traversal/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def inorderTraversal(self, root: TreeNode) -> List[int]:
        if not root:
            return []
        res = []
        res.extend(self.inorderTraversal(root.left))
        res.append(root.val)
        res.extend(self.inorderTraversal(root.right))
        return res

```