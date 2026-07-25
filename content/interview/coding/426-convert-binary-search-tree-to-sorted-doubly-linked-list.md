---
slug: "426-convert-binary-search-tree-to-sorted-doubly-linked-list"
section: "coding"
title: "426. Convert Binary Search Tree to Sorted Doubly Linked List"
status: "published"
pinned: false
tags: ["Inorder Traversal", "Tree"]
created_at: 1674972899
updated_at: 1699250876
published_at: 1674972899
---
[426\. Convert Binary Search Tree to Sorted Doubly Linked List](https://leetcode.com/problems/convert-binary-search-tree-to-sorted-doubly-linked-list/)

從程式碼比較好理解

```python
"""
# Definition for a Node.
class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
"""

class Solution:
    def treeToDoublyList(self, root: 'Node') -> 'Node':
        if not root:
            return None
        head = None
        tail = None
        def dfs(node: 'Node'):
            nonlocal head, tail
            if node:
                dfs(node.left)
                if not tail:
                    # 如果還沒有尾巴，代表我們走到了最左邊的節點
                    # 這時候頭和尾巴都是此節點
                    head = node
                    tail = node
                else:
                    # 如果已經有尾巴了，這時候做兩件事情
                    # 第一：建立雙向連結
                    #     將目前的尾巴節點的右邊，指向現在的節點
                    #     將當前指向的節點的左邊，指向當前的尾巴
                    # 第二：尾巴節點向右移動
                    tail.right = node
                    node.left = tail
                    tail = tail.right
                dfs(node.right)
        dfs(root)
        head.left = tail
        tail.right = head
        return head

```