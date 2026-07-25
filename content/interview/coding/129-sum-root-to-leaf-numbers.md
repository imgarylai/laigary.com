---
slug: "129-sum-root-to-leaf-numbers"
section: "coding"
title: "129. Sum Root to Leaf Numbers"
status: "published"
pinned: false
tags: ["Backtrack", "Tree"]
created_at: 1721524598
updated_at: 1721524674
published_at: 1721524598
---
[129\. Sum Root to Leaf Numbers](https://leetcode.com/problems/sum-root-to-leaf-numbers/)

請參考 [257\. Binary Tree Paths](/interview/coding/257-binary-tree-paths)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def __init__(self):
        self.res = 0
    def sumNumbers(self, root: Optional[TreeNode]) -> int:

        self.res = 0

        def traverse(node, curr):
            if not node:
                return
            if not node.left and not node.right:
                curr = curr * 10 + node.val
                self.res += curr
                curr = curr // 10
                return
            curr = curr * 10 + node.val
            traverse(node.left, curr)
            traverse(node.right, curr)
            curr = curr // 10

        traverse(root, 0)

        return self.res
```