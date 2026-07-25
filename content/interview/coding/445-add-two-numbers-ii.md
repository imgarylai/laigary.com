---
slug: "445-add-two-numbers-ii"
section: "coding"
title: "445. Add Two Numbers II"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973112
updated_at: 1674973112
published_at: 1674973112
---
[445\. Add Two Numbers II](https://leetcode.com/problems/add-two-numbers-ii/)

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head: ListNode) -> ListNode:
        if not head or not head.next:
            return head
        node = self.reverseList(head.next)
        head.next.next = head
        head.next = None
        return node

    def addTwoNumbersOne(self, l1: ListNode, l2: ListNode) -> ListNode:
        carry = False
        head = ans = ListNode()
        while l1 or l2:
            val = 0
            if l1 and l2:
                val = l1.val + l2.val
                l1 = l1.next
                l2 = l2.next
            elif l1:
                val = l1.val
                l1 = l1.next
            elif l2:
                val = l2.val
                l2 = l2.next
            if carry:
                val += 1
            carry = val >= 10
            ans.next = ListNode(val % 10)
            ans = ans.next

        if carry:
            ans.next = ListNode(1)

        return head.next

    def addTwoNumbers(self, l1: ListNode, l2: ListNode) -> ListNode:
        newl1 = self.reverseList(l1)
        newl2 = self.reverseList(l2)
        sumTwoNumbers = self.addTwoNumbersOne(newl1, newl2)
        res = self.reverseList(sumTwoNumbers)
        return res

```