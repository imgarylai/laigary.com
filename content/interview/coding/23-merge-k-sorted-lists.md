---
slug: "23-merge-k-sorted-lists"
section: "coding"
title: "23. Merge k Sorted Lists"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1674972898
updated_at: 1721535770
published_at: 1674972898
---
[23\. Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/)

這一題有多個不同的做法，我喜歡先從已經有的概念來出法，第一個概念是我們已經知道 [21\. Merge Two Sorted Lists](/interview/coding/21-merge-two-sorted-lists) 的方法，和 2 Sum 很像，我們如果知道了 2 Sum ，有沒有辦法延伸到 k Sum ？

其實是可以的，第一個方法就是我們我們先從第一個和第二個 Linked List 合併，並存到第二個 Linked List 上，再來合併第二個跟第三個…依此類推，一直到合併第 `k - 1` 和第 `k` 個。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        heap = []
        heapq.heapify(heap)
        for node in lists:
            if node:
                # id(ld) 是這個解法比較要注意的地方。
                heapq.heappush(heap, (node.val, id(node), node))

        curr = head = ListNode()
        while heap:
            val, _, node = heapq.heappop(heap)
            curr.next = node
            curr = curr.next
            node = node.next
            if node:
                heapq.heappush(heap, (node.val, id(node), node))
        return head.next
```

不過其實這就很像是 [148\. Sort List](/interview/coding/148-sort-list) ，我們不用一個一個合併，我們可以兩兩合併就好。這樣在合併的過程所需要花費的時間就會變成 $log(N)$ 。

這裡要注意的就是數學的處理，如果說總共有偶數個 Linked List ，每兩兩合併不會有太大的問題，可是如果是奇數個，那最後落單的要怎麼處理？或是偶數個 Linked List 合併之後，變成奇數個了，那要怎麼處理？

其實不用太擔心，因為奇數偶數會一直重複出現，主要的概念是第一次處理完後，變成剩下 `k/2` 要處理，再處理一次後，剩下 `k/4` 要處理，接著是 `k/8` …等直到結束。

可以用這個方式去看看變化

```python
if __name__ == '__main__':
    arr = [i for i in range(10)]

    interval = 1
    while interval < len(arr):
        for i in range(0, len(arr) - interval, interval * 2):
            print(i, end=',')
        print()
        interval *= 2

```
```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeTwoLists(self, l1: List[ListNode], l2: List[ListNode]) -> ListNode:
        curr = head = ListNode()
        while l1 and l2:
            if l1.val < l2.val:
                curr.next = l1
                l1 = l1.next
            else:
                curr.next = l2
                l2 = l2.next
            curr = curr.next

        if not l2:
            curr.next = l1
        if not l1:
            curr.next = l2
        return head.next


    def mergeKLists(self, lists: List[ListNode]) -> ListNode:
        amount = len(lists)
        interval = 1
        while interval < amount:
            for i in range(0, amount - interval, interval * 2):
                lists[i] = self.mergeTwoLists(lists[i], lists[i + interval])
            interval *= 2
        return lists[0] if amount > 0 else None

```

## Head

最後有一個解法是最難想到的寫法，而且做法也很漂亮，是透過 Heap 與 Linked List 的特性一起發揮出來的。

一開始把所有 Linked List 的 head 放入到 heap 裡面，透過他們的值來排序，接著就不斷地從 heap 裡面拿出值最小的節點，連接起來。

在連接的時候要注意，連結完畢之後，要將該節點往下移一格後，重新放回 heap 中，唯獨一個 Python 中要注意的事情是，放入到 heap 時，要給一個隨機的值，讓 heap 可以分辨出當有值相同的節點時，兩個節點其實並不同。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeKLists(self, lists: List[ListNode]) -> ListNode:
        q = []
        heapq.heapify(q)
        for li in lists:
            if li:
                # id(ld) 是這個解法比較要注意的地方。
                heapq.heappush(q, (li.val, id(li), li))

        curr = head = ListNode()
        while q:
            val, _, node = heapq.heappop(q)
            curr.next = node
            curr = curr.next
            node = node.next
            if node:
                heapq.heappush(q, (node.val, id(node), node))
        return head.next

```