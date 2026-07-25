---
slug: "106-construct-binary-tree-from-inorder-and-postorder-traversal"
section: "coding"
title: "106. Construct Binary Tree from Inorder and Postorder Traversal"
status: "published"
pinned: false
tags: ["Postorder Traversal", "Tree"]
created_at: 1674972936
updated_at: 1699250899
published_at: 1674972936
---
[106\. Construct Binary Tree from Inorder and Postorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/)

postorder 的順序，就是根節點是最後一個數字

```text
inorder = [9,3,15,20,7], postorder = [9,15,7,20,3]

```
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def buildTree(self, inorder: List[int], postorder: List[int]) -> TreeNode:
        table = {}
        for idx, val in enumerate(inorder):
            table[val] = idx

        def traverse(leftIndex, rightIndex):
            if leftIndex > rightIndex:
                return None
            root = TreeNode(postorder.pop())
            rootIndex = table[root.val]
            root.right = traverse(rootIndex + 1, rightIndex)
            root.left = traverse(leftIndex, rootIndex - 1)
            return root
        return traverse(0, len(inorder) - 1)

```