---
slug: "142-linked-list-cycle-ii"
section: "coding"
title: "142. Linked List Cycle II"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972894
updated_at: 1721537961
published_at: 1674972894
---
[142\. Linked List Cycle II](https://leetcode.com/problems/linked-list-cycle-ii/)

承上題，這個題目除了要確定題目中的 Linked List 有沒有環，還要告訴我們環在哪裡

第一個方法就是去判斷這個節點是不是有造訪過，如果遇上第一個已經造訪過的節點，那該節點就是形成環的節點。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, x):
#         self.val = x
#         self.next = None

class Solution:
    def detectCycle(self, head: ListNode) -> ListNode:
        S = set()

        node = head

        while node:
            if node in S:
                return node
            else:
                S.add(node)
                node = node.next
        return None

```

這個方法的時間複雜度還 ok ，不過就空間複雜度來說，使用了非常多的空間記錄所有造訪過的點。

而且我們有前面那一題的經驗，是不是可以透過快慢指針來找呢？那找到快慢指針遇到的節點，是不是就是答案的節點呢？答案是錯的，可以想像 F1 賽車，快的車超過慢的車的點，可能是比賽賽道中的任何一個點，並不是環的起始點。

首先我們還是要先找到哪一個點是確認有環的點，而如果這時候也可以確定沒有環了，就可以直接回傳 `None` 給題目了。

這裡有個證明就是當找到相遇點後，相遇點和環起點的距離，會剛好跟起點到環起點的距離一樣，所以這時候就只要有兩個速度一樣的指針，一個從起點開始出發，一個從相遇點出發，相遇到的點就會是環的起點。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, x):
#         self.val = x
#         self.next = None

class Solution:
    def detectCycle(self, head: ListNode) -> ListNode:
        slow = head
        fast = head
        meet = None
        # Check if there is a cycle first
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow == fast:
                meet = slow
                break
        if not meet:
            return None

        p1 = head
        p2 = meet

        while p1 != p2:
            p1 = p1.next
            p2 = p2.next

        return p1

```