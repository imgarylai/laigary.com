---
slug: "103-binary-tree-zigzag-level-order-traversal"
section: "coding"
title: "103. Binary Tree Zigzag Level Order Traversal"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Tree"]
created_at: 1742875070
updated_at: 1742875090
published_at: 1742875070
---
[103\. Binary Tree Zigzag Level Order Traversal](https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def zigzagLevelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        
        if not root:
            return []
        
        q = deque([root])
        ans = []
        count = 0
        
        
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
            if count%2 == 1:
                curr = curr[::-1]
            
            count += 1
            ans.append(curr)
        
        return ans
```