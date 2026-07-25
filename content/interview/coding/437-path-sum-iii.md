---
slug: "437-path-sum-iii"
section: "coding"
title: "437. Path Sum III"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972936
updated_at: 1767160033
published_at: 1674972936
---
[437\. Path Sum III](https://leetcode.com/problems/path-sum-iii/)

更難的樹的遍歷加上回溯法。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def pathSum(self, root: TreeNode, targetSum: int) -> int:
        if not root:
            return 0
        result = []
        def backtrack(node, targetSum, curr):
            if not node:
                return 

            curr.append(node.val)
            if node.val == targetSum:
                result.append(list(curr)) 

            backtrack(node.left, targetSum - node.val, curr)
            backtrack(node.right, targetSum - node.val, curr)
            curr.pop()

        def dfs(node):
            backtrack(node, targetSum, [])
            if node.left:
                dfs(node.left)
            if node.right:
                dfs(node.right)
        dfs(root)
        return len(result)

```