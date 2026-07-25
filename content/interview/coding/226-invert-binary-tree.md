---
slug: "226-invert-binary-tree"
section: "coding"
title: "226. Invert Binary Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972900
updated_at: 1674972900
published_at: 1674972900
---
[226\. Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def invertTree(self, root: TreeNode) -> TreeNode:
        if not root:
            return root
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root

```