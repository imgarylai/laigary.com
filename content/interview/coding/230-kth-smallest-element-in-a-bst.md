---
slug: "230-kth-smallest-element-in-a-bst"
section: "coding"
title: "230. Kth Smallest Element in a BST"
status: "published"
pinned: false
tags: ["Inorder Traversal", "Tree"]
created_at: 1674972900
updated_at: 1721499462
published_at: 1674972900
---
[230\. Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/)

題目求，如何在一個平衡二元樹中找出第 k 小個的值？

首先可以先想題目為何給定平衡二元樹呢？因為平衡二元樹有著一個特別的特性

1.  左子樹的所有節點的值必定小於根節點
2.  右子樹的所有節點的值必定大於根節點

也就是如果要在這棵樹中找出最小的第 k 個值，那一定是先從左子樹開始找，找不到時再從右子樹開始找。而這個順序也就是 inorder traversal （中序遍歷）的順序。

## 中序遍歷

中序遍歷的順序，就是 BST 的大小順序

```python
class Solution:
    def __init__(self):
        self.rank = 0
    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:

        ans = root.val
        def inorder(root):
            nonlocal ans
            if not root:
                return
            inorder(root.left)
            self.rank += 1
            if self.rank == k:
                ans = root.val
            inorder(root.right)

        inorder(root)
        return ans

```

## 迭代（中序遍歷）

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:
        stack = []
        while True:
            while root:
                stack.append(root)
                root = root.left
            root = stack.pop()
            k -= 1
            if not k:
                return root.val
            root = root.right

```