---
slug: "92-reverse-linked-list-ii"
section: "coding"
title: "92. Reverse Linked List II"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1674972901
updated_at: 1743481742
published_at: 1674972901
---
[92\. Reverse Linked List II](https://leetcode.com/problems/reverse-linked-list-ii/)

這一題的難度是中等，可是實作上的細節非常多，迭代可以完成這個任務，可是真的很多邊角情況要處理，但是如果用遞迴的方式的話好處理很多，不過比較不好理解。另外這裡會假設反轉部分 Linked List 的情況是當我們有 `n` 個節點，最多也只會反轉 `n` 個節點。

反轉部分 Linked List 有幾點要完成：

1.  我們要返回的是第 `n` 個點，`n` 從 `1` 開始算。
2.  一開始的起頭點，要指向剩下的節點的開頭，這裡用繼任者（successor）來稱呼 。

```python
# 原先的節點
[1] -> [2] -> [3] -> [4] -> [5]

# 我們要完成的目標
[1] <- [2] <- [3]    [4] -> [5]
 |                    ^
 |                    |
 ----------------------

```

處理的方式跟 [206\. Reverse Linked List](/interview/coding/206-reverse-linked-list) 很像，都是先處理 base case ，這裡多了一個 base case 要處理

1.  原先的 base case ，如果說剛好是到了 Linked List 的最末端，此時沒有繼任者，所以回傳是 `None, head` 。
2.  第二種 base case 是每次遞迴的時候，都是 `n - 1` 的往下遞迴，所以當 `n == 1` 時，代表已經成功的遞迴到目標處，此時回傳的值是 `head.next, head` 分別是繼任者，與當前的節點。下面的 Code 為了方便起見，我有宣告了變數來儲存繼任者。
3.  接著就是一層一層地返回，返回的值都是繼任者，以及結尾 ，此時要注意的是
4.  目前當前節點還是指向原先指向的節點
5.  將當前節點原先指向的節點指向當前節點
6.  當前節點指向**繼任者**
7.  回傳**繼任者、結尾的節點**

到這裡為止，已經先完成了如何反轉從零到 N 的節點

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseListN(self, head: ListNode, n: int) -> ListNode:
        if n == 1:
            successor = head.next
            return successor, head
        if not head or not head.next: 
            return None, head
        successor, last = self.reverseListN(head.next, n - 1)
        head.next.next = head
        head.next = successor
        return successor, last

```

接下來題目的邏輯就很簡單了，題目問的不是從 `1 -> n` ，而是從 `left -> right` ，所以我們就一步一步的遞迴走去到該節點，一直到 `left` 為 `1` 的時候，

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:


    def reverseBetween(self, head: Optional[ListNode], left: int, right: int) -> Optional[ListNode]:
        if left == 1:
            sucessor, last = self.reverseN(head, right)
            return last
        
        head.next = self.reverseBetween(head.next, left - 1, right - 1)
        return head
            
    
    def reverseN(self, head, n):
        if n == 1:
            sucessor = head.next
            return sucessor, head

        if not head or not head.next:
            return None, head

        sucessor, last = self.reverseN(head.next, n - 1)
        head.next.next = head
        head.next = sucessor
        return sucessor, last
        
```
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:

    def reverseN(self, head, n):
        if head is None or head.next is None:
            return head
        pre, cur, nxt = None, head, head.next
        while n > 0:
            cur.next = pre
            pre = cur
            cur = nxt
            if nxt is not None:
                nxt = nxt.next
            n -= 1
        head.next = cur
        return pre


    def reverseBetween(self, head: Optional[ListNode], left: int, right: int) -> Optional[ListNode]:
        if left == 1:
            return self.reverseN(head, right)
        pre = head
        for i in range(1, left - 1):
            pre = pre.next
        pre.next = self.reverseN(pre.next, right - left + 1)
        return head
```