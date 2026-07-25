---
slug: "701-insert-into-a-binary-search-tree"
section: "coding"
title: "701. Insert into a Binary Search Tree"
status: "published"
pinned: false
tags: ["Tree", "Two Pointers"]
created_at: 1674972899
updated_at: 1707892943
published_at: 1674972899
---
[701\. Insert into a Binary Search Tree](https://leetcode.com/problems/insert-into-a-binary-search-tree/)

如果是要在一個 BST 中插入一個點，那我們要做的就是先找到是哪個點可以插入。

而透過 BST 的特性，我們可以知道

1.  根節點左側的所有數值，一定都要比自己小。
2.  根節點右側的所有數值，一定都要比自己大。

因此我們在樹的遍歷時，就可以透過不斷比較節點的值得知應該要往左子樹還是右子樹去遍歷。最終一定會找到一個空節點，那個點就會是可以插入節點的地方。

所以這就是一個二分搜索的題目，先找到哪裡需要插入，是要插入在左子樹，還是插入在右子樹。

最後的 Base case 是當走到最後時，透過題目給個目標值建立一個新的節點並回傳。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def insertIntoBST(self, root: TreeNode, val: int) -> TreeNode:
        if not root:
            return TreeNode(val)
        if root.val > val:
            root.left = self.insertIntoBST(root.left, val)
        elif root.val < val:
            root.right = self.insertIntoBST(root.right, val)
        return root

```

不過其實這個題目只要最後完成的樹是二元搜尋樹，答案是都可以接受的，因此此題目也存在著另一個解法，那就是我們可以把樹先全部都展開，此時所有的值都是依序排列好的，接著再重新的建造一個新的二元搜尋樹即可。