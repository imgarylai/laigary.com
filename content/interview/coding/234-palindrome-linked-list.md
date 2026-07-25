---
slug: "234-palindrome-linked-list"
section: "coding"
title: "234. Palindrome Linked List"
status: "published"
pinned: false
tags: ["Classic", "Palindrome"]
created_at: 1674973111
updated_at: 1674973111
published_at: 1674973111
---
[234\. Palindrome Linked List](https://leetcode.com/problems/palindrome-linked-list/)

這一題是一道簡單的題目，可是其實很容易不小心踩到雷。第一個直覺的想法會是我們就把 Linked List 反轉，接著比較一下是不是都一樣就好。可是如果我們要反轉 Linked List ，第一件要做的事情會是我們要先複製一個原先的 Linked List ，不然 Linked List 都是傳指標，反轉完原先的 Linked List 就沒了。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def cloneLinkedList(self, head) -> ListNode:
        copy = copy_head = ListNode(0)
        curr = head
        while curr:
            copy.next = ListNode(curr.val)
            copy = copy.next
            curr = curr.next
        return copy_head.next

    def reverseList(self, head: ListNode) -> ListNode:
        node = None
        while head:
            tmp = head.next
            head.next = node
            node = head
            head = tmp
        return node

    def isPalindrome(self, head: ListNode) -> bool:
        cloned = self.reverseList(self.cloneLinkedList(head))
        curr = head

        while curr:
            if curr.val != cloned.val:
                return False
            curr = curr.next
            cloned = cloned.next
        return True

```

不過這一題其實存在著更優的解法，雖然理論時間複雜度並沒有真的改變非常多，可是少使用了很多的記憶體。

回文的題目的特性之一，就是前後對稱，所以我們其實並不用比對到整個 Linked List ，只要比對到一半就好，可是 Linked List 並沒有長度的概念，所以可以利用快慢指針的方式，取得 Linked List 的中間點（[876\. Middle of the Linked List](/interview/coding/876-middle-of-the-linked-list)）

第二步就是我們從中間點到結尾的部分，反轉整個 Linked List ，這樣的話我們就會有兩個**「幾乎」**一模一樣的 Linked List，接下來和上面的部分一樣，一起齊步走，如果中間有一個位置發生不同的值，那就不是回文。

如果有看到**「幾乎」**不一樣的地方的話，就要注意了，回文有另外一個特性，在每個題目裡面我們都要注意，那就是回文的長度是奇數還是偶數，這裡要注意的只有奇數個個數的回文，在我們找中點的時候，後半部的元素其實是會多一的長度，可是我們在檢查得時候需不需要注意呢？是不需要的，因為在反轉 Linked List 時，這個最中間的元素，會到最後面，每個元素都檢查完的時候，雖然說只會剩下這個元素沒有被檢查到，但是因為只有一個元素，也符合回文的特性，所以不檢查也沒關係，程式就不需要特別額外的去判斷。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    # 206. Reverse Linked List
    def reverseList(self, head: ListNode) -> ListNode:
        prev = None
        while head:
            tmp = head.next
            head.next = prev
            prev = head
            head = tmp
        return prev
    # 876. Middle of the Linked List
    def middleNode(self, head: ListNode) -> ListNode:
        slow = fast = head

        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        return slow

    def isPalindrome(self, head: ListNode) -> bool:
        mid = self.middleNode(head) 
        node = self.reverseList(mid)

        while node:
            if node.val != head.val:
                return False
            node = node.next
            head = head.next

        return True

```