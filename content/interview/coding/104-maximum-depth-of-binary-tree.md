---
slug: "104-maximum-depth-of-binary-tree"
section: "coding"
title: "104. Maximum Depth of Binary Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972897
updated_at: 1722577808
published_at: 1674972897
---
[104\. Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxDepth(self, root: TreeNode) -> int:
        if not root:
            return 0
        left = self.maxDepth(root.left)
        right = self.maxDepth(root.right)
        return max(left, right) + 1

```