---
slug: "143-reorder-list"
section: "coding"
title: "143. Reorder List"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1766562023
updated_at: 1766562062
published_at: 1766562023
---
[143\. Reorder List](https://leetcode.com/problems/reorder-list/)

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reorderList(self, head: Optional[ListNode]) -> None:
        """
        Do not return anything, modify head in-place instead.
        """
        slow = head
        fast = head

        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next

        # slow point to the middle point of the linked list

        def reverse(node):
            if not node or not node.next:
                return node
            last = reverse(node.next)
            node.next.next = node
            node.next = None
            return last

        r = reverse(slow.next)
        slow.next = None

        tmp = head
        while r:
            tmp_next = tmp.next
            r_next = r.next
            
            tmp.next = r        
            r.next = tmp_next
            
            tmp = tmp_next
            r = r_next
        
        return head
```