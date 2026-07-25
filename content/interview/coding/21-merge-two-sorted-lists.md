---
slug: "21-merge-two-sorted-lists"
section: "coding"
title: "21. Merge Two Sorted Lists"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1717911236
updated_at: 1717911741
published_at: 1717911236
---
[21\. Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/)

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        h1 = list1
        h2 = list2

        res = ListNode(-1)
        tmp = res

        while h1 != None and h2 != None:
            if h1.val < h2.val:
                res.next = h1
                h1 = h1.next
                res = res.next
            else:
                res.next = h2
                h2 = h2.next
                res = res.next 

        while h1 != None:
            res.next = h1
            h1 = h1.next
            res = res.next

        while h2 != None:
            res.next = h2
            h2 = h2.next
            res = res.next 
        
        return tmp.next
```