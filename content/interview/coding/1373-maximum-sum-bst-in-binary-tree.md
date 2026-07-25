---
slug: "1373-maximum-sum-bst-in-binary-tree"
section: "coding"
title: "1373. Maximum Sum BST in Binary Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972936
updated_at: 1674972936
published_at: 1674972936
---
[1371\. Maximum Sum BST in Binary Tree](https://leetcode.com/problems/maximum-sum-bst-in-binary-tree/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def __init__(self):
        self.max = 0
    def maxSumBST(self, root: TreeNode) -> int:

        def traverse(root: TreeNode):
            if not root:
                return {'isValidBST': True, 'minVal': float('inf'), 'maxVal': float('-inf'), 'total': 0}
            left = traverse(root.left)
            right = traverse(root.right)
            res = {'isValidBST': False, 'minVal': float('inf'), 'maxVal': float('-inf'), 'total': 0}
            if right['isValidBST'] and left['isValidBST'] and root.val > left['maxVal'] and root.val < right['minVal']:
                res['isValidBST'] = True
                res['minVal'] = min(left['minVal'], root.val)
                res['maxVal'] = max(right['maxVal'], root.val)
                res['total'] = left['total'] + right['total'] + root.val
                self.max = max(self.max, res['total'])

            return res
        traverse(root)
        return self.max

```