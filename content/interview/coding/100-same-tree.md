---
slug: "100-same-tree"
section: "coding"
title: "100. Same Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1784872186
updated_at: 1784872256
published_at: 1784872196
---
[**100. Same Tree**](https://leetcode.com/problems/same-tree/)

```py
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSameTree(self, p: TreeNode, q: TreeNode) -> bool:
        if not p and not q:
            return True
        if not p or not q or p.val != q.val:
            return False
        return self.isSameTree(p.left, q.left)  and self.isSameTree(p.right, q.right)
```

```py
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSameTree(self, p: TreeNode, q: TreeNode) -> bool:   
        queue = deque([(p, q)])
        
        while queue:
            a, b = queue.popleft()
            if a and b and a.val == b.val:
                queue.extend([(a.left, b.left), (a.right, b.right)])
            elif a or b:
                return False
        
        return True
```

