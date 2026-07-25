---
slug: "145-binary-tree-postorder-traversal"
section: "coding"
title: "145. Binary Tree Postorder Traversal"
status: "published"
pinned: false
tags: ["Postorder Traversal", "Tree"]
created_at: 1674972897
updated_at: 1699250916
published_at: 1674972897
---
[145\. Binary Tree Postorder Traversal](https://leetcode.com/problems/binary-tree-postorder-traversal/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def postorderTraversal(self, root: TreeNode) -> List[int]:
        if not root:
            return []
        res = []
        res.extend(self.postorderTraversal(root.left))
        res.extend(self.postorderTraversal(root.right))
        res.append(root.val)
        return res

```