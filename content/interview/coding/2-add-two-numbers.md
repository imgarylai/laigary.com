---
slug: "2-add-two-numbers"
section: "coding"
title: "2. Add Two Numbers"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973112
updated_at: 1674973112
published_at: 1674973112
---
[2\. Add Two Numbers](https://leetcode.com/problems/add-two-numbers/)

這一題雖然不是加一，不過很類似，所以我放在一起。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def addTwoNumbers(self, l1: ListNode, l2: ListNode) -> ListNode:
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

```