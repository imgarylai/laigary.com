---
slug: "1379-find-a-corresponding-node-of-a-binary-tree-in-a-clone-of-that-tree"
section: "coding"
title: "1379. Find a Corresponding Node of a Binary Tree in a Clone of That Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972898
updated_at: 1674972898
published_at: 1674972898
---
[1379\. Find a Corresponding Node of a Binary Tree in a Clone of That Tree](https://leetcode.com/problems/find-a-corresponding-node-of-a-binary-tree-in-a-clone-of-that-tree/)

作法類似 [100\. Same Tree](/interview/coding/100-same-tree)

面試時首先要確保 original 和 cloned 一定是一模一樣的結構與樹（基本上一定會是一樣的啦，不然這題就不可能做了）

## DFS

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Solution:
    def getTargetCopy(self, original: TreeNode, cloned: TreeNode, target: TreeNode) -> TreeNode:
        if not original or not cloned:
            return None
        if original == target: return cloned
        left = self.getTargetCopy(original.left, cloned.left, target)
        if left: return left
        right = self.getTargetCopy(original.right, cloned.right, target)
        return right

```

## BFS

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Solution:
    def getTargetCopy(self, original: TreeNode, cloned: TreeNode, target: TreeNode) -> TreeNode:
        queue = deque([(original, cloned)])

        while queue:
            ori, clo = queue.popleft()
            if ori == target:
                return clo
            if ori.left:
                queue.append((ori.left, clo.left))
            if ori.right:
                queue.append((ori.right, clo.right))

```