---
slug: "148-sort-list"
section: "coding"
title: "148. Sort List"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1674972900
updated_at: 1674972900
published_at: 1674972900
---
[148\. Sort List](https://leetcode.com/problems/sort-list/)

這題的想法是 [Merge Sort (Accepted)](/interview/coding?tag=Sorting) ，Merge Sort 的核心是不斷的將一串數列從「中間分一半」： [876\. Middle of the Linked List](/interview/coding/876-middle-of-the-linked-list) ，再從小的問題慢慢的合併起來： [21\. Merge Two Sorted Lists](/interview/coding/21-merge-two-sorted-lists)

比較特別的一點是因為這是一個 `Linked List` ，所以這題有一個地方要注意，那就是比較慢的那個點，其實是要先找到「中間點」的前一個點，因為當要做 Divide 時，我們要從中間切開，因此我們先記錄好中間點後，要從中間點的前一個點，把 Linked List 從「中間點」斷開，斷開後在後面的 Merge List 裡面合併起來。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def middleNode(self, head: ListNode) -> ListNode:
        fast, slow = head.next, head
        while fast and fast.next:
            fast = fast.next.next
            slow = slow.next
        mid = slow.next
        slow.next = None
        return mid

    def mergeTwoLists(self, l1: ListNode, l2: ListNode) -> ListNode:
        prevHead = ListNode(-1)
        prev = prevHead
        while l1 and l2:
            if l1.val <= l2.val:
                prev.next = l1
                l1 = l1.next
            else:
                prev.next = l2
                l2 = l2.next
            prev = prev.next

        prev.next = l1 if l1 else l2
        return prevHead.next

    def sortList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head or not head.next:
            return head
        mid = self.middleNode(head)
        left = self.sortList(head)
        right = self.sortList(mid)
        return self.mergeTwoLists(left, right)

```