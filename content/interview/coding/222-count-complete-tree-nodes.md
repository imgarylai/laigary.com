---
slug: "222-count-complete-tree-nodes"
section: "coding"
title: "222. Count Complete Tree Nodes"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972936
updated_at: 1674972936
published_at: 1674972936
---
[222\. Count Complete Tree Nodes](https://leetcode.com/problems/count-complete-tree-nodes/)

## 線性搜索

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def countNodes(self, root: Optional[TreeNode]) -> int:

        def dfs(node):
            if not node:
                return 0
            if not node.left and not node.right:
                return 1
            left = dfs(node.left)
            right = dfs(node.right)
            return left+right+1

        return dfs(root)

```

這樣的時間複雜度是 $O(n)$ ，老實說其實不差，不過這個題目存在這另一個更快速的解法，這個不容易想到，不過不算很難理解。

## 二分搜索

上面的作法並沒有使用到題目給的 [Complete Tree](https://web.cecs.pdx.edu/~sheard/course/Cs163/Doc/FullvsComplete.html#:~:text=A%20complete%20binary%20tree%20is,as%20far%20left%20as%20possible.) 的特性，那就是樹的每一層都是完整的結構，除了最後一層。

這個方法要想到確實不簡單，在面試時要寫出 bug free 也滿困難的。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:

    def getDepth(self, node: Optional[TreeNode]) -> int:
        depth = 0
        while node.left:
            node = node.left
            depth += 1
        return depth

    def exists(self, idx, depth, node) -> bool:
        left = 0
        right = 2 ** depth - 1
        for _ in range(depth):
            mid = left + (right - left)//2
            if idx <= mid:
                node = node.left
                right = mid
            else:
                node = node.right
                left = mid + 1
        return node is not None

    def countNodes(self, root: Optional[TreeNode]) -> int:

        if not root:
            return 0

        depth = self.getDepth(root)

        if depth == 0:
            return 1

        left = 1
        right = 2 ** depth - 1
        while left <= right:
            mid = left + (right - left)//2
            if self.exists(mid, depth, root):
                left = mid + 1
            else:
                right = mid - 1

        return 2**depth - 1 + left

```