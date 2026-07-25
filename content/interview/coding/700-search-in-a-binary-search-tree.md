---
slug: "700-search-in-a-binary-search-tree"
section: "coding"
title: "700. Search in a Binary Search Tree"
status: "published"
pinned: false
tags: ["Binary Search", "Tree"]
created_at: 1674972898
updated_at: 1699335621
published_at: 1674972898
---
[700\. Search in a Binary Search Tree](https://leetcode.com/problems/search-in-a-binary-search-tree/)

如果說題目只是問「樹」中是否存在一個節點有某個值，那基本上我們就是從根去找，如果不是答案，再繼續去左、右子樹找。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def searchBST(self, root: TreeNode, val: int) -> TreeNode:
        if not root or root.val == val:
            return root
        return self.searchBST(root.left, val) or self.searchBST(root.right, val)

```

但是如果是 BST ，就可以利用 BST 的特性，去做二分搜索，提高演算法的效率。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def searchBST(self, root: TreeNode, val: int) -> TreeNode:
        if not root or root.val == val:
            return root
        if root.val > val:
            return self.searchBST(root.left, val)
        elif root.val <= val:
            return self.searchBST(root.right, val)

```