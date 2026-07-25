---
slug: "543-diameter-of-binary-tree"
section: "coding"
title: "543. Diameter of Binary Tree"
status: "published"
pinned: false
tags: ["Postorder Traversal", "Tree"]
created_at: 1674972897
updated_at: 1742795992
published_at: 1674972897
---
[543\. Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/)

這一題和 [124\. Binary Tree Maximum Path Sum](/interview/coding/124-binary-tree-maximum-path-sum) 很類似，都是一題後序遍歷的題目，其中遍歷的返回值並不是我們要的答案，答案是是要在後序遍歷的過程中，利用後序遍歷的求解的過程，找出我們要的答案。

和 124 一樣，我們可以先開啟觀察者模式，透過觀察者找出所有的圓周。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def __init__(self):
        self.diameter = 0

    def diameterOfBinaryTree(self, root: TreeNode) -> int:
        diameters= []
        def helper(root):
            if not root:
                return 0
            left = helper(root.left)
            right = helper(root.right)
            diameters.append(left + right)
            return max(left, right) + 1
        helper(root)
        return max(diameters)

```

簡化成一個變數。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def __init__(self):
        self.diameter = 0

    def diameterOfBinaryTree(self, root: TreeNode) -> int:
        def helper(root):
            if not root:
                return 0
            left = helper(root.left)
            right = helper(root.right)
            self.diameter = max(self.diameter, left + right)
            return max(left, right) + 1
        helper(root)
        return self.diameter

```