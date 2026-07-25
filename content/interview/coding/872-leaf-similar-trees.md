---
slug: "872-leaf-similar-trees"
section: "coding"
title: "872. Leaf-Similar Trees"
status: "published"
pinned: false
tags: ["Preorder Traversal", "Tree"]
created_at: 1710028228
updated_at: 1710028258
published_at: 1710028228
---
[872\. Leaf-Similar Trees](https://leetcode.com/problems/leaf-similar-trees/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def leafSimilar(self, root1: Optional[TreeNode], root2: Optional[TreeNode]) -> bool:
        
        def dfs(root, res):
            if not root.left and not root.right:
                res.append(root.val)
            if root.left:
                dfs(root.left, res)
            if root.right:
                dfs(root.right, res)
        leaves1 = []
        leaves2 = []
        dfs(root1, leaves1)
        dfs(root2, leaves2)

        if len(leaves1) != len(leaves2):
            return False
        
        for v1, v2 in zip(leaves1, leaves2):
            if v1 != v2:
                return False
        
        return True
```