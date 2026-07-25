---
slug: "141-linked-list-cycle"
section: "coding"
title: "141. Linked List Cycle"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1698818377
updated_at: 1703748482
published_at: 1698818377
---
[141. Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/)

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, x):
#         self.val = x
#         self.next = None

class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:

        seen = set()

        while head:
            if head in seen:
                return True
            seen.add(head)
            head = head.next

        return False
```
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, x):
#         self.val = x
#         self.next = None

class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        if head is None:
            return False
        slow = head
        fast = head.next

        while slow != fast:
            if fast is None or fast.next is None:
                return False
            slow = slow.next
            fast = fast.next.next
        return True

```