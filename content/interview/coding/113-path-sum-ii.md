---
slug: "113-path-sum-ii"
section: "coding"
title: "113. Path Sum II"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972897
updated_at: 1674972897
published_at: 1674972897
---
[113\. Path Sum II](https://leetcode.com/problems/path-sum-ii/)

這一題比較困難的是，雖然是樹的遍歷加上回溯法。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def pathSum(self, root: TreeNode, targetSum: int) -> List[List[int]]:

        result = []
        def backtrack(node, targetSum, curr):
            if not node:
                return 

            curr.append(node.val)
            if node.val == targetSum and not node.left and not node.right:
                result.append(list(curr))
            else:
                backtrack(node.left, targetSum - node.val, curr)
                backtrack(node.right, targetSum - node.val, curr)
            curr.pop()

        backtrack(root, targetSum, [])
        return result

```