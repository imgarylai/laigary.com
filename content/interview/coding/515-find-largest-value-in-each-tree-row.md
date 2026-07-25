---
slug: "515-find-largest-value-in-each-tree-row"
section: "coding"
title: "515. Find Largest Value in Each Tree Row"
status: "published"
pinned: false
tags: ["Breadth-First Search", "Tree"]
created_at: 1742874297
updated_at: 1742874502
published_at: 1742874297
---
[515\. Find Largest Value in Each Tree Row](https://leetcode.com/problems/find-largest-value-in-each-tree-row/)

題目要熟悉 BFS ，可以先熟悉 [199\. Binary Tree Right Side View](/interview/coding/199-binary-tree-right-side-view)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def largestValues(self, root: Optional[TreeNode]) -> List[int]:
        if not root:
            return []
        ans = []
        q = deque([root])

        while q:
            currMax = float('-inf')
            for _ in range(len(q)):
                node = q.popleft()
                currMax = max(currMax, node.val)
                if node.left:
                    q.append(node.left)
                if node.right:
                    q.append(node.right)
            ans.append(currMax)
        
        return ans
```