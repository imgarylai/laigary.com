---
slug: "653-two-sum-iv-input-is-a-bst"
section: "coding"
title: "653. Two Sum IV - Input is a BST"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973110
updated_at: 1674973110
published_at: 1674973110
---
[653\. Two Sum IV - Input is a BST](https://leetcode.com/problems/two-sum-iv-input-is-a-bst/)

這一個題目的重點在於在遍歷樹的同時，有沒有出現過目標值減去該節點的值。

記錄的方式法是用 Set 來做紀錄

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def findTarget(self, root: TreeNode, k: int) -> bool:
        if not root:
            return False
        s = set()
        q = [root]

        while q:
            size = len(q)
            for i in range(size):
                node = q.pop(0)
                if k - node.val in s:
                    return True
                s.add(node.val)
                if node.left:
                    q.append(node.left)
                if node.right:
                    q.append(node.right)

        return False

```