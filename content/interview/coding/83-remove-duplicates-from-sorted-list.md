---
slug: "83-remove-duplicates-from-sorted-list"
section: "coding"
title: "83. Remove Duplicates from Sorted List"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1674972895
updated_at: 1761277641
published_at: 1674972895
---
[83\. Remove Duplicates from Sorted List](https://leetcode.com/problems/remove-duplicates-from-sorted-list/)

這個題目是快慢指針的題目，慢指針指向的是當前答案的最後一個節點，如果此時快指針指向的節點的值和慢指針指向節點的值相同的時候，代表還有重複值的節點，繼續移動快指針，直到看到一個新的值為止。

最後要記得的是慢指針要收尾，因為有可能最後所有的節點的數值都一樣，快指針就走完了，慢指針的下一個節點要指向空指針。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def deleteDuplicates(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head:
            return head
        slow = head
        fast = head

        while fast:
            if fast.val != slow.val:
                slow.next = fast
                slow = slow.next
            fast = fast.next

        slow.next = None
        return head

```

時間複雜度為 $O(n)$

空間複雜度為 $O(1)$ 我們並不需要額外建立記憶體空間來儲存值。