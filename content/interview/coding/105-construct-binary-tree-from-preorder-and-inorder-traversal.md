---
slug: "105-construct-binary-tree-from-preorder-and-inorder-traversal"
section: "coding"
title: "105. Construct Binary Tree from Preorder and Inorder Traversal"
status: "published"
pinned: false
tags: ["Preorder Traversal", "Tree"]
created_at: 1674972895
updated_at: 1721453889
published_at: 1674972895
---
[105\. Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)

題目給出前序遍歷以及中序遍歷的順序，希望我們可以構建出原先樹的樣貌。

老實說這個題目滿困難的，沒有寫過的話面試是真的很難寫的出來，但是我們可以慢慢梳理這個問題。

先理解前中後序遍歷的規則，會分成這幾類的重點在於造訪根節點的順序，此時就可以知道前序遍歷的陣列，其第一個點一定是整棵樹的根節點。

而其後的值，則可能是左子樹或是右子樹的根節點，但是是左或是右，無法得知。

這時候回到中序遍歷的節點，中序遍歷的陣列我們完全就看不出來到底哪個點是跟節點了，在沒有其他資訊的情況底下，任何一個點都可以是根節點，因此要再找出下一個根節點的意義不大。

可是在前序遍歷中，我們得知了根節點的數值了，如果說我們能夠找到該值在中序遍歷的位置後，就可以知道，該位置左邊的所有數值都是屬於左子樹，右邊的所有數值都是屬於右子樹，進而可以把把一整個陣列拆開來整理。

```text
1. 先從 preorder 中取第一個數值，這個數值是根節點的數值
2. 再 inorder 中找到該值得位置 x 。
3. (如果左子樹存在) preorder 的下一個位置即是左子樹的根節點
4. (如果右子樹存在) preorder 的下一個位置即是右子樹的根節點
```

在上方的邏輯裡面，我們已經找到了一個遞迴關係式了。但是下一個問題是如何建構題目中，左右子樹存在的檢查？

在第二點中，我們得知根節點的位置在 x 後，其實可以推論出

1.  左子樹的範圍會在 `0 ~ x - 1` 之間。
2.  右子樹的範圍會在 `x + 1 ~ n` 之間。

當這個邊界範圍重疊時，代表只有一個點在該範圍中，而該點就是一個根節點而已，沒有任何的子樹。

而當邊界的範圍越界之後，也就是左側邊界大於右側邊界後，代表根本沒有節點，也就滿足了檢查子樹存不存在的條件。

這時候上方的邏輯可以改成

```text
1. 檢查目前的邊界是否有越界？
2. 先從 preorder 中取第一個數值，這個數值是根節點的數值
3. 再 inorder 中找到該值得位置 x 。
4. preorder 的下一個位置即是左子樹的根節點，並把邊界的範圍縮小成 0 ~ x - 1 
5. preorder 的下一個位置即是右子樹的根節點，並把邊界的範圍縮小成 x + 1, n
```

當這個邏輯整理出來後，可以透過程式的遞迴關係式改寫：

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def buildTree(self, preorder: List[int], inorder: List[int]) -> TreeNode:
        table = {}
        for idx, val in enumerate(inorder):
            table[val] = idx

        preorder = deque(preorder)

        def traverse(leftIndex, rightIndex):
            if leftIndex > rightIndex:
                return None
            root = TreeNode(preorder.popleft())
            rootIndex = table[root.val]
            root.left = traverse(leftIndex, rootIndex - 1)
            root.right = traverse(rootIndex + 1, rightIndex)
            return root
        return traverse(0, len(inorder) - 1)

```