---
slug: "606-construct-string-from-binary-tree"
section: "coding"
title: "606. Construct String from Binary Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972895
updated_at: 1699251179
published_at: 1674972895
---
[606\. Construct String from Binary Tree](https://leetcode.com/problems/construct-string-from-binary-tree/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def tree2str(self, root: Optional[TreeNode]) -> str:

        def traverse(root):
            if not root:
                return ''
            left = traverse(root.left)
            right = traverse(root.right)
            if len(left) == 0 and len(right) == 0:
                return str(root.val)
            elif len(left) == 0:
                return str(root.val) + '()' + '(' + right  +')'
            elif len(right) == 0:
                return str(root.val) + '(' + left  +')'
            return str(root.val) + '(' + left + ')' + '(' + right  +')'
        return traverse(root)

```