---
slug: "linked-list-template"
section: "coding"
title: "Linked List 模板"
status: "published"
pinned: false
tags: ["Linked List"]
created_at: 1784876687
updated_at: 1784876687
published_at: 1784876687
---
Linked List 的題目八成能被兩個工具解決：**dummy head** 和**快慢指針**。難的不是想法，是指針改動的順序 — 所以先畫圖再寫 code。

## Dummy head：讓「刪除頭節點」不再是特例

只要可能動到頭節點，就先加一個假的頭：

```python
dummy = ListNode(0, head)
prev = dummy
while prev.next:
    if 要刪掉 prev.next:
        prev.next = prev.next.next   # 不用判斷是不是頭節點
    else:
        prev = prev.next
return dummy.next                     # 注意回傳 dummy.next 而不是 head
```

同樣的技巧也用在「一邊走一邊接新節點」的題目（合併、分割），`tail` 負責接、`dummy.next` 是答案。

例題：[21. Merge Two Sorted Lists](/interview/coding/21-merge-two-sorted-lists)、[19. Remove Nth Node From End of List](/interview/coding/19-remove-nth-node-from-end-of-list)

## 反轉：三個指針的固定舞步

```python
def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next      # 1. 先存下一個，否則等下就斷了
        curr.next = prev     # 2. 反轉指向
        prev = curr          # 3. 兩個指針各前進一步
        curr = nxt
    return prev              # curr 走到 None，prev 就是新的頭
```

四行的順序背下來，反轉相關的題目全部是它的變形（反轉一段、每 k 個一組反轉，就是先定位再套這段）。

例題：[206. Reverse Linked List](/interview/coding/206-reverse-linked-list)、[92. Reverse Linked List II](/interview/coding/92-reverse-linked-list-ii)

## 快慢指針：找中點、判環

```python
slow = fast = head
while fast and fast.next:      # 這個條件同時保護奇偶長度
    slow = slow.next
    fast = fast.next.next
# 迴圈結束：slow 在中點（偶數長度時是後半段的第一個）
```

判環就是在迴圈裡加 `if slow is fast: return True`。要找**環的入口**，相遇後把其中一個指針放回 head，兩個都改成一次一步，再相遇的點就是入口。

例題：[876. Middle of the Linked List](/interview/coding/876-middle-of-the-linked-list)、[141. Linked List Cycle](/interview/coding/141-linked-list-cycle)、[142. Linked List Cycle II](/interview/coding/142-linked-list-cycle-ii)

## 組合技

多數中難題就是把上面三個拼起來：

- **[143. Reorder List](/interview/coding/143-reorder-list)** = 找中點 → 反轉後半 → 交錯合併
- **[234. Palindrome Linked List](/interview/coding/234-palindrome-linked-list)** = 找中點 → 反轉後半 → 逐一比對
- **[148. Sort List](/interview/coding/148-sort-list)** = 找中點切兩半 → 遞迴 → 合併（merge sort）

看到新題目時先問：需要中點嗎？需要反轉嗎？需要 dummy 嗎？

## 面試時的講法

先講清楚你要維護哪幾個指針、各自代表什麼，然後**畫出兩三個節點的小例子**跑一遍給面試官看。空鏈表、單節點、偶數長度這三個邊界一定會被問到，主動講出來。

更多題目 → [#Linked List](/interview/coding?tag=Linked%20List)
