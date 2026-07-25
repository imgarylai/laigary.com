---
slug: "144-binary-tree-preorder-traversal"
section: "coding"
title: "144. Binary Tree Preorder Traversal"
status: "published"
pinned: false
tags: ["Preorder Traversal", "Tree"]
created_at: 1674972935
updated_at: 1699250752
published_at: 1674972935
---
[144\. Binary Tree Preorder Traversal](https://leetcode.com/problems/binary-tree-preorder-traversal/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:    
    def preorderTraversal(self, root: TreeNode) -> List[int]:
        if not root:
            return []
        res = []
        res.append(root.val)
        res.extend(self.preorderTraversal(root.left))
        res.extend(self.preorderTraversal(root.right))
        return res

```