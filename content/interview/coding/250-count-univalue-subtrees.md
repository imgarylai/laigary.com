---
slug: "250-count-univalue-subtrees"
section: "coding"
title: "250. Count Univalue Subtrees"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972899
updated_at: 1674972899
published_at: 1674972899
---
[250\. Count Univalue Subtrees](https://leetcode.com/problems/count-univalue-subtrees/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isUniValSubStree(self, node: TreeNode) -> bool:
        if node.right is None and node.left is None:
            self.count += 1
            return True
        is_uni = True
        if node.left:
            is_uni = self.isUniValSubStree(node.left) and is_uni and  node.left.val == node.val
        if node.right:
            is_uni = self.isUniValSubStree(node.right) and is_uni and  node.right.val == node.val
        if is_uni:
            self.count += 1
        return is_uni

    def countUnivalSubtrees(self, root: TreeNode) -> int:
        if not root:
            return 0
        self.count = 0
        self.isUniValSubStree(root)
        return self.count

```