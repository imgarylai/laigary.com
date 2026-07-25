---
slug: "98-validate-binary-search-tree"
section: "coding"
title: "98. Validate Binary Search Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972900
updated_at: 1766981461
published_at: 1674972900
---
[98\. Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/)

一開始的根節點，其值可以為任意數值，因為根節點並沒有任何的限制

但是從此開始，左邊的子樹，最大值會必須是嚴格的小於根節點的值，是左子樹的右邊界。

右邊的子樹，最小值必須是嚴格的大於根節點的值，是右子樹的左邊界。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isValidBST(self, root: TreeNode) -> bool:

        def traverse(node, left=float('-inf'), right=float('inf')):
            if not node:
                return True
            if left < node.val < right:
                return traverse(node.left, left, node.val) and traverse(node.right, node.val, right)
            return False
        return traverse(root)

```