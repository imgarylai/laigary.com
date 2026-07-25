---
slug: "99-recover-binary-search-tree"
section: "coding"
title: "99. Recover Binary Search Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972899
updated_at: 1674972899
published_at: 1674972899
---
[99\. Recover Binary Search Tree](https://leetcode.com/problems/recover-binary-search-tree/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def recoverTree(self, root: TreeNode) -> None:
        """
        Do not return anything, modify root in-place instead.
        """
        first = None
        second = None
        prev = TreeNode(float('-inf'))
        def traverse(root):
            nonlocal first, second, prev
            if not root:
                return 
            traverse(root.left)
            if not first and prev.val >= root.val:
                first = prev
            if first and prev.val >= root.val:
                second = root
            prev = root
            traverse(root.right)
        traverse(root)
        tmp = first.val
        first.val = second.val
        second.val = tmp

```