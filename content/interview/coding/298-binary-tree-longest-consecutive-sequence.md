---
slug: "298-binary-tree-longest-consecutive-sequence"
section: "coding"
title: "298. Binary Tree Longest Consecutive Sequence"
status: "published"
pinned: false
tags: ["Backtrack", "Tree"]
created_at: 1721526862
updated_at: 1721526951
published_at: 1721526862
---
[298\. Binary Tree Longest Consecutive Sequence](https://leetcode.com/problems/binary-tree-longest-consecutive-sequence/)

參考：[257\. Binary Tree Paths](/interview/coding/257-binary-tree-paths)

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:

    def __init__(self):
        self.res = 0

    def longestConsecutive(self, root: Optional[TreeNode]) -> int:
        
        def traverse(node, curr):
            if not node:
                return
            if not node.left and not node.right:
                if len(curr) == 0:
                    self.res = max(self.res, 1)
                    return
                if node.val == curr[-1] + 1:
                    self.res = max(self.res, len(curr) + 1)
                else:
                    self.res = max(self.res, len(curr))
                return
            
            if len(curr) == 0:
                curr.append(node.val)
            else:
                if node.val == curr[-1] + 1:
                    curr.append(node.val)
                else:
                    curr = [node.val]
            self.res = max(self.res, len(curr))                    
            traverse(node.left, curr)
            traverse(node.right, curr)
            curr.pop()
        
        traverse(root, [])

        return self.res

```