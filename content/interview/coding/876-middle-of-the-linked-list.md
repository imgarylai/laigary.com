---
slug: "876-middle-of-the-linked-list"
section: "coding"
title: "876. Middle of the Linked List"
status: "published"
pinned: false
tags: ["Linked List", "Two Pointers"]
created_at: 1674972901
updated_at: 1709446680
published_at: 1674972901
---
[876\. Middle of the Linked List](https://leetcode.com/problems/middle-of-the-linked-list/)

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:
        curr = head
        count = 1
        while curr.next != None:
            curr = curr.next
            count += 1
        
        res = head
        count = count // 2
        while count > 0:
            count -= 1
            res = res.next

        return res
```

快慢指針

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def middleNode(self, head: ListNode) -> ListNode:
        slow = head
        fast = head

        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next

        return slow

```