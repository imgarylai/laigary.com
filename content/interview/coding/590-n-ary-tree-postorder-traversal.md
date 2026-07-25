---
slug: "590-n-ary-tree-postorder-traversal"
section: "coding"
title: "590. N-ary Tree Postorder Traversal"
status: "published"
pinned: false
tags: ["Postorder Traversal", "Tree"]
created_at: 1674972935
updated_at: 1699250930
published_at: 1674972935
---
[590\. N-ary Tree Postorder Traversal](https://leetcode.com/problems/n-ary-tree-postorder-traversal/)

```python
"""
# Definition for a Node.
class Node:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children
"""

class Solution:
    def postorder(self, root: 'Node') -> List[int]:
        if not root:
            return []
        res = []
        for child in root.children:
            res.extend(self.postorder(child))
        res.append(root.val)
        return res

```