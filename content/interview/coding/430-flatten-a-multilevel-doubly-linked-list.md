---
slug: "430-flatten-a-multilevel-doubly-linked-list"
section: "coding"
title: "430. Flatten a Multilevel Doubly Linked List"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1674972900
updated_at: 1674972900
published_at: 1674972900
---
[430\. Flatten a Multilevel Doubly Linked List](https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/)

```python
"""
# Definition for a Node.
class Node:
    def __init__(self, val, prev, next, child):
        self.val = val
        self.prev = prev
        self.next = next
        self.child = child
"""

class Solution:
    def flatten(self, head: 'Node') -> 'Node':
        if not head:
            return head

        prevHead = Node(None, None, head, None)
        prev = prevHead
        stack = [head]

        while stack:
            curr = stack.pop()

            prev.next = curr
            curr.prev = prev

            if curr.next:
                stack.append(curr.next)

            if curr.child:
                stack.append(curr.child)
                curr.child = None

            prev = curr
        prevHead.next.prev = None
        return prevHead.next

```