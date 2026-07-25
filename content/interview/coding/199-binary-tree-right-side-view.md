---
slug: "199-binary-tree-right-side-view"
section: "coding"
title: "199. Binary Tree Right Side View"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Tree"]
created_at: 1710220132
updated_at: 1710220178
published_at: 1710220132
---
[199\. Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/)

這一題和 [116\. Populating Next Right Pointers in Each Node](/interview/coding/116-populating-next-right-pointers-in-each-node) 是姐妹題。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:
        
        if not root:
            return root

        queue = deque([root])
        res = []

        while queue:
            n = len(queue) - 1

            for i in range(len(queue)):
                node = queue.popleft()
                if i == n:
                    res.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
                
        
        return res
```