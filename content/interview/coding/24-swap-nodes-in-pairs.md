---
slug: "24-swap-nodes-in-pairs"
section: "coding"
title: "24. Swap Nodes in Pairs"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1743477676
updated_at: 1743477982
published_at: 1743477676
---
[24\. Swap Nodes in Pairs](https://leetcode.com/problems/swap-nodes-in-pairs/)

我一開始的想法比較單純，因為題目是要求奇數跟偶數的位置交換，所以我很直覺的寫了一個先把奇數位置的元素記錄起來，再把偶數元素記錄起來，最後再重新串起來。

```python
class Solution:
    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head or not head.next:
            return head
        
        # 建立兩個 dummy head
        odd_dummy = ListNode(0)
        even_dummy = ListNode(0)
        odd_curr = odd_dummy
        even_curr = even_dummy

        curr = head
        is_odd = True

        # Step 1: 分開奇數與偶數位置節點
        while curr:
            if is_odd:
                odd_curr.next = curr
                odd_curr = odd_curr.next
            else:
                even_curr.next = curr
                even_curr = even_curr.next
            curr = curr.next
            is_odd = not is_odd
        
        # 防止循環
        odd_curr.next = None
        even_curr.next = None

        # Step 2: 將 even 和 odd 交錯串起來（交換位置）
        even_ptr = even_dummy.next
        odd_ptr = odd_dummy.next
        dummy = ListNode(0)
        curr = dummy

        while even_ptr and odd_ptr:
            curr.next = even_ptr
            even_ptr = even_ptr.next
            curr = curr.next

            curr.next = odd_ptr
            odd_ptr = odd_ptr.next
            curr = curr.next

        # 只可能剩一個奇數節點沒接上（奇數長度）
        if odd_ptr:
            curr.next = odd_ptr

        return dummy.next

```

這個做法可以改良到 in place 的做法：

```python
class Solution:
    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        dummy.next = head
        prev = dummy

        while head and head.next:
            first = head
            second = head.next

            # swap
            prev.next = second
            first.next = second.next
            second.next = first

            # 移動到下一對
            prev = first
            head = first.next

        return dummy.next
```

遞迴的解法

```python
class Solution:
    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:
        # base case：0個或1個節點，無需交換
        if not head or not head.next:
            return head

        # 將第一、第二個節點定義為 first 和 second
        first = head
        second = head.next

        # 遞迴交換後續節點，接到 first 後面
        first.next = self.swapPairs(second.next)
        # 第二個節點指向第一個節點，完成交換
        second.next = first

        # 回傳新的頭節點（也就是 second）
        return second

```