---
slug: "206-reverse-linked-list"
section: "coding"
title: "206. Reverse Linked List"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1710221259
updated_at: 1743478444
published_at: 1710221259
---
[206\. Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/)

在當前的節點中，我們要把原先指向下一個節點的方向，轉變為指向上一個節點（已經反轉完成的節點），接著處理下一個節點。

1.  因為指向下一個節點的方向換掉後，會造成這個連結斷掉，所以要先透過一個暫存的節點紀錄下一個節點的。
2.  此時可以把指向下一個節點的方向，指向上一個節點。
3.  該節點會變成下一個節點要指向的方向，所以要更新。
4.  轉換完畢，前往下一個節點。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head:
            return head
        
        prev = None
        curr = head

        while curr:
            tmp = curr.next
            curr.next = prev
            prev = curr
            curr = tmp
        
        return prev
```

## 遞迴

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        
        if head is None or head.next is None:
            return head
        
        last = self.reverseList(head.next)

        # Pointing next's next to self. 
        head.next.next = head
        head.next = None

        return last
```

[92. Reverse Linked List II](/interview/coding/92-reverse-linked-list-ii)