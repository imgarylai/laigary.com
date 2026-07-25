---
slug: "450-delete-node-in-a-bst"
section: "coding"
title: "450. Delete Node in a BST"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972898
updated_at: 1699343424
published_at: 1674972898
---
[450\. Delete Node in a BST](https://leetcode.com/problems/delete-node-in-a-bst/)

這個題目給定的條件可以很簡單：給定一個數值，要我們在二元搜尋樹中找到哪個節點的數值等於此值，並且刪掉他。乍聽之下，好像我們只要做兩件事情：

1.  遍歷找到該節點
2.  刪掉他

可是其實和插入不同，刪除完節點後，我們要確認是不是要把剪斷的分支，繼續接回樹上，並且保持二元搜索樹的結構。這可能是題目沒有提到的。如果不用接上的話會簡單很多，因此這裡討論的是要接上的問題。

要接上的時候，可以從左子樹的根節點或是右子樹的根節點任選，因為二元搜索樹的結構，已經確保了左子樹的所有值一定小於右子樹的所有值，只要把左子樹的根節點接上，再確保左子樹的右子樹接上的是原先的右子樹就好。（可以用相反的邏輯，套在右子樹上）

但是這就產生了另外一個問題，要是原本的左子樹有右子樹怎麼辦？這是沒有辦法確認的，尤其還要處理子樹的子樹，原本是要找到終止條件，結果變成無限遞迴的問題。

這個題目我在想的時候的確想得滿久的，我先退一步地想，那就是如果我要接上這個點的節點，沒有任何子樹就好了。

於是假設我想要把右子樹接上，只要把兩個邏輯放在一起想就好：

1.  右子樹的最小值，根據定義，永遠都比左子樹的最大值來的大
2.  右子樹的最小值，一定在右子樹的子樹中，最左的葉子上。

所以如果我可以找到這個葉子，我就能透過以下步驟刪除掉目標的節點。

1.  把這個右子樹最左的葉子找到，重新當作根節點
2.  把原先的左子樹接上這個新的根節點
3.  把剩餘的右子樹接上這個新的根節點
4.  把這個根節點接回原先的樹

上面的第四點會變成我們要記錄原先的是哪個節點連接著的，但是上面的邏輯可以再透過原有的記憶點空間，改成以下的邏輯

1.  找到右子樹最左的葉子時，把這個葉子的值取代掉現在的根節點
2.  此時根節點的左子樹並沒有改變
3.  把右節點連接上原有的右子樹
4.  接下來透過遞迴的方式，我們要做的是右子樹中，原先是最小值的這個值，把他們刪掉（題目的遞迴關係式）

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def deleteNode(self, root: TreeNode, key: int) -> TreeNode:
        if not root: return root
        if root.val > key:
            root.left = self.deleteNode(root.left, key)
        elif root.val < key:
            root.right = self.deleteNode(root.right, key)
        elif root.val == key:
            if not root.left:
                return root.right
            if not root.right:
                return root.left
            smallestOnRight = root.right
            while smallestOnRight.left:
                smallestOnRight = smallestOnRight.left
            root.val = smallestOnRight.val
            root.right = self.deleteNode(root.right, smallestOnRight.val)
        return root

```