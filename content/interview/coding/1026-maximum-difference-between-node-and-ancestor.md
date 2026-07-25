---
slug: "1026-maximum-difference-between-node-and-ancestor"
section: "coding"
title: "1026. Maximum Difference Between Node and Ancestor"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1742794622
updated_at: 1760936269
published_at: 1742794622
---
[1026\. Maximum Difference Between Node and Ancestor](https://leetcode.com/problems/maximum-difference-between-node-and-ancestor/)

這題要找的是 **「某個節點與它的祖先節點之間的差異最大值」**。節點的選擇可以是樹中的任何一點，可以不是原始的根節點，這也是這個題目最困難的地方。

換句話說，這個題目的暴力解法可以是我先從根節點開始，往每個子節點探索，找出最大的差異，之後再從另外的一個新的節點出發，重新遍歷一次所有的節點。

這樣的暴力法有著非常多的重複，也非常沒有效率。如果要更有效率的解決這個問題，需要再觀察此題目。

這個題目有一個限制，是要找出的兩個點，其中一個一定要是從祖先來的，不能是旁邊不同的樹的子節點。所以如果我在某個節點上，可以知道所有祖先節點的值，我就能夠找出最大值了。但是如果更仔細的再想一下這個條件，其實我說不定不用所有祖先節的的值，我只要可以記錄到祖先節點的最大值以及最小值就好。

為什麼呢？因為題目是要求極值，在當前節點上，能夠產生出極值的情況，一定只有最大值跟最小值，會同時取最大跟最小則是因為我們需要的是絕對值。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxAncestorDiff(self, root: Optional[TreeNode]) -> int:

        self.result = 0

        def dfs(node, minVal, maxVal):
            if not node:
                return
            dfs(node.left, min(minVal, node.val), max(maxVal, node.val))
            dfs(node.right, min(minVal, node.val), max(maxVal, node.val))
            self.result = max(self.result, abs(maxVal - node.val), abs(minVal - node.val))
            
        dfs(root, root.val, root.val)

        return self.result
```
```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxAncestorDiff(self, root: Optional[TreeNode]) -> int:
        
        def dfs(node, minVal, maxVal):
            if not node:
                return 0
            currMax = max(abs(node.val - minVal), abs(node.val - maxVal))
            leftMax = dfs(node.left, min(minVal, node.val), max(maxVal, node.val))
            rightMax = dfs(node.right, min(minVal, node.val), max(maxVal, node.val))
            return max(currMax, leftMax, rightMax)
        
        return dfs(root, root.val, root.val)
```