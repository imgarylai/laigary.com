---
slug: "138-copy-list-with-random-pointer"
section: "coding"
title: "138. Copy List with Random Pointer"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973128
updated_at: 1674973128
published_at: 1674973128
---
[138\. Copy List with Random Pointer](https://leetcode.com/problems/copy-list-with-random-pointer/)

這一題更能顯現為什麼 Hash Table 是一個非常好用的查找工具，這一題比前面幾題難困難的點在於，之前我們遍歷過的點，只要標記成造訪過，我們就可以不用再管他了，可是這一題多了一個如果說每個節點會隨機指向任何一個節點，也就是說會造成這個 Linked List 是有環的，我們就不能單純的遍歷整個 Linked List 來完成，不然複製 Linked List 是很簡單的一件事情，只要一步一步向前走就可以完成了。

我當時想到的一點就是，Hash Map 可以快速的幫我映射出原本圖型中的節點，可以快速對應到新圖型中的節點。

所以我決定先把這個映射建立起來，因為如果我有映射了，原圖型隨機對應到的節點，我用節點 X 做代表，我也可以用 Hash Table 去找到，那個 X 節點他在新圖形映射的節點 X' 是哪一個。這時候我就可以把這隨機連結的節點給連接起來了。

```python
"""
# Definition for a Node.
class Node:
    def __init__(self, x: int, next: 'Node' = None, random: 'Node' = None):
        self.val = int(x)
        self.next = next
        self.random = random
"""

class Solution:
    def copyRandomList(self, head: 'Node') -> 'Node':
        curr = head
        copy = copy_head = Node(0)

        table = {}

        # 先複製好 Linked List ，並且建立映射 X -> X'
        while curr:
            copy.next = Node(curr.val)
            copy = copy.next
            table[curr] = copy
            curr = curr.next

        curr = head
        copy = copy_head.next

        while curr:
            # 如果原圖形有隨機指向的節點
            if curr.random:
                # 找到在新圖形對應的節點 R -> R' 
                random = table[curr.random]
                # 連結起來
                copy.random = random
            # 新舊 Linked List 一起移動起來
            curr = curr.next
            copy = copy.next
        return copy_head.next

```