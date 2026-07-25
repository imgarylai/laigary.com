---
slug: "938-range-sum-of-bst"
section: "coding"
title: "938. Range Sum of BST"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1742875955
updated_at: 1743303811
published_at: 1742875955
---
[938\. Range Sum of BST](https://leetcode.com/problems/range-sum-of-bst/)

這個題目雖然是簡單，但應該只是實作簡單，真的寫起來不是這麼好想。

我的第一個想法是利用 BST 的特性，如果我用中序遍歷，其遍歷的順序剛好是從最小值到最大值，我就把這些數值記錄起來，接著再利用題目的下界與上界值，找出我需要的邊界，再把該範圍的數值記錄起來。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def rangeSumBST(self, root: Optional[TreeNode], low: int, high: int) -> int:
        
        res = []

        def traverse(node):
            if not node:
                return
            traverse(node.left)
            res.append(node.val)
            traverse(node.right)
        
        traverse(root)

        left = 0
        right = len(res) - 1

        while res[left] < low:
            left += 1
        
        while res[right] > high:
            right -= 1

        return sum(res[left:right+1])
```

這樣的做法可以通過，不過這個題目存在著一個更適合題目特性的解法。

今天看根節點

1.  其值如果小於下界值的時候，代表的是我們想要找的總和一定會在右子樹。
2.  其值如果大於上界值的時候，代表的是我們想要找的總和一定會在左子樹。
3.  最困難的是如果值是介於下界值跟上界值之間的話怎麼辦？
    1.  首先是那這個跟節點一定會被計算進去總和
    2.  接著我們可以繼續遞回左子樹，在遞回左子樹的過程中，透過上面的流程，就會再次的決定左子樹是否會被計算進去
    3.  右子樹亦同。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def rangeSumBST(self, root: Optional[TreeNode], low: int, high: int) -> int:
        if not root:
            return 0
        
        if root.val < low:
            return self.rangeSumBST(root.right, low, high)
        elif root.val > high:
            return self.rangeSumBST(root.left, low, high)
        else:
            return root.val + self.rangeSumBST(root.left, low, high) + self.rangeSumBST(root.right, low, high)
```