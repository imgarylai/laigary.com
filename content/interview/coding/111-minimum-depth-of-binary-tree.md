---
slug: "111-minimum-depth-of-binary-tree"
section: "coding"
title: "111. Minimum Depth of Binary Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972897
updated_at: 1742788986
published_at: 1674972897
---
[111\. Minimum Depth of Binary Tree](https://leetcode.com/problems/minimum-depth-of-binary-tree/)

## DFS

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def minDepth(self, root: TreeNode) -> int:
        if not root:
            return 0
        if not root.left:
            return 1 + self.minDepth(root.right)
        if not root.right:
            return 1 + self.minDepth(root.left)
        
        left = self.minDepth(root.left)
        right = self.minDepth(root.right)
        return 1 + min(left, right)
```

## BFS

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def minDepth(self, root: TreeNode) -> int:
        if not root:
            return 0
        
        queue = deque([root])  # 初始化隊列，將根節點加入隊列
        level = 0
        
        while queue:
            level += 1  # 每次進入一層，level 加 1
            size = len(queue)  # 當前層的節點數量
            
            for _ in range(size):
                node = queue.popleft()  # 從隊列中移除節點
                # 如果節點是葉子節點，返回當前層的深度
                if not node.left and not node.right:
                    return level
                
                # 否則將左右子樹加入隊列
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
        
        return level

```