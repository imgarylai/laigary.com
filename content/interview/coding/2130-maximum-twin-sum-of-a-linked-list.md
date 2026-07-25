---
slug: "2130-maximum-twin-sum-of-a-linked-list"
section: "coding"
title: "2130. Maximum Twin Sum of a Linked List"
status: "published"
pinned: false
tags: []
created_at: 1743478634
updated_at: 1743820687
published_at: 1743478634
---
[2130\. Maximum Twin Sum of a Linked List](https://leetcode.com/problems/maximum-twin-sum-of-a-linked-list/)

1.  用快慢指針找到中間點，並記錄有幾個 pairs
2.  將後半部的 linked list 反轉
3.  此時前半部的指針方向為順向，後半部的指針方向為逆向，又因為題目保證 n 為偶數，所以前面有幾個 pairs 就可以計算出每個 twin 的總和，並且在過程中不斷地比較最大值。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def pairSum(self, head: Optional[ListNode]) -> int:
        slow = head
        fast = head

        n = 0
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            n += 1
        
        prev = None
        curr = slow

        while curr:
            tmp = curr.next
            curr.next = prev
            prev = curr
            curr = tmp
        
        forward = head
        backward = prev
        res = float('-inf')
        while n > 0:
            res = max(forward.val + backward.val, res)
            forward = forward.next
            backward = backward.next
            n -= 1
        
        return res
```