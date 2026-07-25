---
slug: "124-binary-tree-maximum-path-sum"
section: "coding"
title: "124. Binary Tree Maximum Path Sum"
status: "published"
pinned: false
tags: ["Postorder Traversal", "Tree"]
created_at: 1674972936
updated_at: 1721451650
published_at: 1674972936
---
[124\. Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/)

這一題是後序遍歷的經典題目，後序遍歷的精神就是**先將子樹的問題全部解決，再開始處理跟節點的問題，**這一題要怎麼想到的確是屬於困難的題型。

既然是樹的題目，一定少不了遍歷，既然有遍歷，又因為是要找路徑，所以 BFS 廣度優先搜索，不是很適合，那看來就剩下使用 DFS 深度優先搜索了。既然是 DFS 就是一個遞迴的關係式，DFS 又分前序、中序、後序遍歷，前序和前序遍歷的話都不太對，因為我們應該要知道兩個子樹的狀態，才知道我要怎麼在根節點處理，那就只剩下後序遍歷了？

可是後序遍歷合理嗎？這裡要思考的是，在遍歷的時候，我們要知道哪個資訊？在這個題目，我應該要我知道左子樹的最大路徑總和，還有右子樹的最大路徑總和，這樣的話也可以找到在此跟節點，該往左子樹才會得到最大路徑總和，還是右子樹可以得到最大路徑總和？

這個概念如下圖：這個題目會告訴我們，當我站在該節點上，我應該要往左邊走，還是往右邊走，可以走到最大的路徑總和，但是這個解法的答案，從根節點出發，並不是題目要的。題目要問的是**一棵樹裡面，任意兩個節點之間的總和要最大**。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution: 
    def maxPathSum(self, root: TreeNode) -> int:
        def traverse(node):
            if not node:
                return 0
            left = max(traverse(node.left), 0)
            right = max(traverse(node.right), 0)
            return max(left, right) + node.val
        traverse(root)
        return ans

```

因為想到上面的解法，其實很接近我們要的答案了，可是在面試的時候沒有開啟上帝視角，不知道到底缺了什麼，是方向錯誤了？還是理解題目錯誤，這個時候我會認為適時的和面試官討論（加分）是有幫助的。因為他們才是有開啟上帝視角的人，其實這個題目的最後一部分也不是難到真的完全想不出來，畢竟真的只差一點點了，但是**這個筆記在討論的都是在處於面試壓力底下，要怎麼樣快速地把自己的知識點整合起來找出可行解**。

上面寫到一半的程式碼可以知道一件事情，那就是每一次拿到的左子樹與右子樹的答案，都是從該節點出發可以獲得的最大值，也就是說如果我把**「根節點的值、左子樹回傳的值以及右子樹的值」**都相加起來，得到的就是，**「經過該根節點總合最大的路徑」**，又因為我們會遍歷所有的節點，所以我們會知道**「所有節點總合最大的路徑」。**

這其實也是這個題目困難的地方

💡

****一般而言，遞迴的目標是在找到最優解，可是這一個樹的題目，遞迴的目標在於遍歷整棵樹，而真正重要的是要在遍歷的同時，去紀錄我們所需要的目標。****

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution: 
    def maxPathSum(self, root: TreeNode) -> int:
        paths = [] # observer 
        def traverse(node):
            if not node:
                return 0
            left = max(traverse(node.left), 0)
            right = max(traverse(node.right), 0)

            # observer 
            paths.append(left + right + node.val)
            return max(left, right) + node.val

        traverse(root)
        return max(paths)

```

上面的寫法在 LeetCode 上面沒有寫出來，我覺得滿可惜的，因為如果有上面的想法，會更容易理解題目想要問什麼，時間複雜度其實是差不多的，當然空間複雜度有差，可是如果寫出上面的寫法後，就容易優化成更優解。

下面的做法是優化空間複雜度的方法，既然我們都知道了觀察員模式，那觀察員只要在遞迴的時候不斷的觀察且紀錄最大值就好。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:

    def __init__(self):
        self.res = float('-inf')

    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        
        def traverse(node):
            if not node:
                return 0
            left = max(traverse(node.left), 0)
            right = max(traverse(node.right), 0)
            self.res = max(self.res, node.val + left + right)
            return max(left, right) + node.val
        
        traverse(root)
        return self.res
```