---
slug: "147-insertion-sort-list"
section: "coding"
title: "147. Insertion Sort List"
status: "published"
pinned: false
tags: ["Linked List", "Sorting"]
created_at: 1699163249
updated_at: 1703654652
published_at: 1699163249
---
[147. Insertion Sort List](https://leetcode.com/problems/insertion-sort-list/)

通常的排序問題都是問的是陣列的排序，這個題目的要求卻是使用[鏈結串列 Linked List](https://zh.wikipedia.org/wiki/%E9%93%BE%E8%A1%A8) 。

題目的解法其實很直覺，從給定的陣列中一每次選擇一個數字，然後放進去一個陣列裡面，每次放進去結果陣列的時候，和目前已經排序好的所有的數字比較，找到要插入的位置，插入該數字，並保持所有的數字依舊有著排序好的狀態。

敘述很簡單，實作上需要注意的細節有

1.  在原先尚未排列好的陣列中，需要知道現在我們已經遍歷到哪個位置上。
2.  建立好一個指針指向我們需要紀錄結果的記憶體位置。
3.  如何找到要插入的位置
4.  如何插入

#### 如何找到插入的位置

在排序好的陣列上，可以先用兩個極端的情況來思考：

1.  插入的值比起現有所有排序好的陣列都來得「小」
2.  插入的值比起現有所有排序好的陣列都來得「大」

如果是第一種情況，當造訪排序好的記憶體空間時，並「不需要」遍歷任何元素，排序好的陣列的「開頭」，即是插入的位置。

如果是第二種情況，當造訪排序好的記憶體空間時，就「需要」遍歷任何元素，直到最後一個位置，排序好的陣列的「結尾」，即是插入的位置。

程式要遍歷的點是當記憶體所指導的位置，比要插入的數值還小的時候，就要繼續遍歷到下一個位置。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def insertionSortList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        
        dummy = ListNode()
        curr = head

        while curr:
            # 輔助節點             
            prev = dummy
            while prev.next and prev.next.val <= curr.val:
                prev = prev.next

            # 記錄需要排序陣列的元素的下一個元素
            next = curr.next
            # 將被排列的元素接下來所指向的元素指向已經排列好的元素
            curr.next = prev.next

            # 輔助節點的下一個指向要插入的元素      
            prev.next = curr

            # 移動到下一個需要被排列的元素
            curr = next

        return dummy.next
```