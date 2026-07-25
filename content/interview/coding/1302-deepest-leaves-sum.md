---
slug: "1302-deepest-leaves-sum"
section: "coding"
title: "1302. Deepest Leaves Sum"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Tree"]
created_at: 1742874745
updated_at: 1760937996
published_at: 1742874745
---
[1302\. Deepest Leaves Sum](https://leetcode.com/problems/deepest-leaves-sum/)

1.  把每一層的總和都記錄起來

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def deepestLeavesSum(self, root: Optional[TreeNode]) -> int:
        
        if not root:
            return 0
        
        levels = []
        q = deque([root])
        
        while q:
            size = len(q)
            curr = []
            for _ in range(size):
                node = q.popleft()
                curr.append(node.val)
                if node.left:
                    q.append(node.left)
                if node.right:
                    q.append(node.right)
            if levels:
                levels.pop()
            levels.append(curr)
        
        return sum(levels[-1])
```

2.  只記錄最後一層

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def deepestLeavesSum(self, root: Optional[TreeNode]) -> int:
        
        q = deque([root])
        result = root.val
        
        while q:
            size = len(q)
            curr = []
            for _ in range(size):
                node = q.popleft()
                curr.append(node.val)
                if node.left:
                    q.append(node.left)
                if node.right:
                    q.append(node.right)
            
            result = sum(curr)
        
        return result
                
```