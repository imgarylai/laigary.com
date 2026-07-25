---
slug: "86-partition-list"
section: "coding"
title: "86. Partition List"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1723175773
updated_at: 1723604909
published_at: 1723175773
---
[86\. Partition List](https://leetcode.com/problems/partition-list/)

這個題目的關鍵在於要理解當指向另一個節點時，會一併把該節點指向的後續節點都放進當前的 Linked List ，我們需要斷開該節點與後續所有節點的連結，並能繼續往前走。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def partition(self, head: Optional[ListNode], x: int) -> Optional[ListNode]:
        dummy1 = ListNode(-1)
        dummy2 = ListNode(-1)

        p1, p2 = dummy1, dummy2
        p = head

        while p: 
            if p.val < x:
                p1.next = p
                p1 = p1.next
            else:
                p2.next = p
                p2 = p2.next
            
            tmp = p.next
            p.next = None
            p = tmp
        
        p1.next = dummy2.next

        return dummy1.next
```