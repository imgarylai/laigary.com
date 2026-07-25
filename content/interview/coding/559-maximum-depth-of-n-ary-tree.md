---
slug: "559-maximum-depth-of-n-ary-tree"
section: "coding"
title: "559. Maximum Depth of N-ary Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972936
updated_at: 1674972936
published_at: 1674972936
---
[559\. Maximum Depth of N-ary Tree](https://leetcode.com/problems/maximum-depth-of-n-ary-tree/)

```python
"""
# Definition for a Node.
class Node:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children
"""

class Solution:
    def maxDepth(self, root: 'Node') -> int:
        if not root:
            return 0
        if not root.children:
            return 1
        return 1 + max([self.maxDepth(child) for child in root.children])

```