---
slug: "1586-binary-search-tree-iterator-ii"
section: "coding"
title: "1586. Binary Search Tree Iterator II"
status: "published"
pinned: false
tags: []
created_at: 1674944279
updated_at: 1674944291
published_at: 1674944279
---
[1586\. Binary Search Tree Iterator II](https://leetcode.com/problems/binary-search-tree-iterator-ii/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class BSTIterator:

    def __init__(self, root: Optional[TreeNode]):
        def inorder(node):
            if not node:
                return []
            res = []
            res.extend(inorder(node.left))
            res.append(node.val)
            res.extend(inorder(node.right))
            return res
        self.res = inorder(root)
        self.size = len(self.res)
        self.index = -1

    def hasNext(self) -> bool:
        return self.index < self.size - 1

    def next(self) -> int:
        self.index += 1
        return self.res[self.index]

    def hasPrev(self) -> bool:
        return self.index > 0

    def prev(self) -> int:
        self.index -= 1
        return self.res[self.index]



# Your BSTIterator object will be instantiated and called as such:
# obj = BSTIterator(root)
# param_1 = obj.hasNext()
# param_2 = obj.next()
# param_3 = obj.hasPrev()
# param_4 = obj.prev()
```