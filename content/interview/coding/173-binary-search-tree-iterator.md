---
slug: "173-binary-search-tree-iterator"
section: "coding"
title: "173. Binary Search Tree Iterator"
status: "published"
pinned: false
tags: []
created_at: 1674944259
updated_at: 1674944270
published_at: 1674944259
---
[173\. Binary Search Tree Iterator](https://leetcode.com/problems/binary-search-tree-iterator/)

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
            res = []
            if not node:
                return []
            res.extend(inorder(node.left))
            res.append(node.val)
            res.extend(inorder(node.right))
            return res
        self.res = deque(inorder(root))

    def next(self) -> int:
        return self.res.popleft()


    def hasNext(self) -> bool:
        return len(self.res)



# Your BSTIterator object will be instantiated and called as such:
# obj = BSTIterator(root)
# param_1 = obj.next()
# param_2 = obj.hasNext()
```