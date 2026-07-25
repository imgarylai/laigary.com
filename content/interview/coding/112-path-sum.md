---
slug: "112-path-sum"
section: "coding"
title: "112. Path Sum"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972899
updated_at: 1710123701
published_at: 1674972899
---
[112\. Path Sum](https://leetcode.com/problems/path-sum/)

這個題目很像是 N Sum 的題目，不過是從根節點開始，找到是不是可以從根節點到葉節點之間，所有的值加起來剛好和目標相同。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def hasPathSum(self, root: TreeNode, targetSum: int) -> bool:
        if not root:
            return False
        if root.val == targetSum and not root.left and not root.right:
            return True
        return self.hasPathSum(root.left, targetSum - root.val) or self.hasPathSum(root.right, targetSum - root.val)

```