---
slug: "2095-delete-the-middle-node-of-a-linked-list"
section: "coding"
title: "2095. Delete the Middle Node of a Linked List"
status: "published"
pinned: false
tags: ["Linked List", "Two Pointers"]
created_at: 1710027047
updated_at: 1710027071
published_at: 1710027047
---
[2095\. Delete the Middle Node of a Linked List](https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/)

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def deleteMiddle(self, head: Optional[ListNode]) -> Optional[ListNode]:
        slow = head
        fast = head

        mid = 0
        while fast.next:
            if fast.next.next:
                fast = fast.next.next
            else:
                fast = fast.next
            mid += 1    
            slow = slow.next
        
        if mid == 0:
            return None
        
        prev = head
        while mid > 1:
            prev = prev.next
            mid -= 1
        prev.next = slow.next

        return head

```