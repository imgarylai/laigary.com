---
slug: "117-populating-next-right-pointers-in-each-node-ii"
section: "coding"
title: "117. Populating Next Right Pointers in Each Node II"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972898
updated_at: 1674972898
published_at: 1674972898
---
[117\. Populating Next Right Pointers in Each Node II](https://leetcode.com/problems/populating-next-right-pointers-in-each-node-ii/)

```python
"""
# Definition for a Node.
class Node:
    def __init__(self, val: int = 0, left: 'Node' = None, right: 'Node' = None, next: 'Node' = None):
        self.val = val
        self.left = left
        self.right = right
        self.next = next
"""

class Solution:
    def connect(self, root: 'Node') -> 'Node':
        if not root:
            return root
        queue = deque([root])

        while queue:
            size = len(queue)
            for i in range(size):
                node = queue.pop(0)
                if i < size - 1:
                    node.next = queue[0]
                if node.left:
                    queue.append(node.left)
                if node.right: 
                    queue.append(node.right)

        return root

```