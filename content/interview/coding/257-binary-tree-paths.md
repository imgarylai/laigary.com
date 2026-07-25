---
slug: "257-binary-tree-paths"
section: "coding"
title: "257. Binary Tree Paths"
status: "published"
pinned: false
tags: ["Backtrack", "Tree"]
created_at: 1721521367
updated_at: 1761707342
published_at: 1721521367
---
[257\. Binary Tree Paths](https://leetcode.com/problems/binary-tree-paths/)

題目給定一個二元樹，要找出從跟節點到最終的葉節點的所有路徑。

既然這個題目要求要找出所有可能的路徑，那就一定是需要窮舉的題目，既然需要窮舉，就可以用 [Backtrack](/interview/coding?tag=Backtrack) 來思考這個題目。

首先我們可以知道，找出路徑的方式一定是夠過深度優先的方式來遍歷整棵樹，這時候可以先建立出 DFS 的方式

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def binaryTreePaths(self, root: Optional[TreeNode]) -> List[str]:

        # DFS
        def traverse(node):
            if not node:
                return
            traverse(node.left)
            traverse(node.right)
    
        traverse(root)
        
        return res
```

既然上面已經建立了遍歷的方式，接著就是要怎麼透過 backtrack 來窮舉出所有的路徑。我心中大致上的方向是這樣的：

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def binaryTreePaths(self, root: Optional[TreeNode]) -> List[str]:

        # DFS
        def traverse(node, curr):
            if not node:
                return
            # When to stop??
            # TODO

            # Is it correct we append here and pop only once?
            curr.append(str(node.val))
            traverse(node.left, curr)
            traverse(node.right, curr)
            curr.pop()
    
        traverse(root, [])
        
        return res
```

但是其中有幾個點需要考慮

1.  還有何時可以算是停止的時機呢？
2.  目前的遞迴方程式總共會向左子樹和右子樹進行遞迴， 上述的方式可以很好的處理目前的記憶方式嗎？

因為這是個遞迴，說實在透過程式的方式來思考是有點難度的，不過回到用樹的方式來思考會比較簡單一點，那就是何時可以視為一個路徑已經結束？那就是我們已經在葉節點的時候，但這個地方和原先遞迴終止的地方是不是一樣的呢？

答案是不同的，因為遞迴終止的條件，已經是葉節點向左右某個子樹去探索並發現該子樹是個空值，也就是那並不是實際意義上的葉節點。

而找到葉節點後就比較像是完成 backtrack 的終止條件了。我們就可以把探索到的路徑，放到紀錄窮舉路徑的記憶體中如下：

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def binaryTreePaths(self, root: Optional[TreeNode]) -> List[str]:

        res = []
        # DFS
        def traverse(node, curr):
            if not node:
                return
            if not node.left and not node.right:
                curr.append(str(node.val))
                res.append("->".join(curr))
                curr.pop()
                return
            # Is it correct we append here and pop only once?
            curr.append(str(node.val))
            traverse(node.left, curr)
            traverse(node.right, curr)
            curr.pop()
    
        traverse(root, [])
        
        return res
```

後一個問題是上面就完成了嗎？我一開始對於 curr 處理的方式有點遲疑，因為我把根節點放進去後，接著進行了兩次的遞迴，但是 curr 的值在進行左子樹遞迴的時候，curr 的值一直有在改變，我想確保的是再次進入到右子樹遞迴時，curr 所含有的內容，和要進行左子樹遞迴的時候一樣，這樣才能確保我們是真的在進行 backtrack 。

這個地方需要一點想像力去完成 backtrack 的過程，答案當然是會的，但是站在最後的端點來思考會比較好思考。

例如：目前有一個節點 x，其兩個左右子樹剛好都是葉節點，兩個葉節點都會把當前節點給移除後，才會返回到我現在這個節點，剛好我在最後一步也把我自己移除了，這時候才會返回上一層，這時候我們再思考一次，如果 x 剛好是一個左字樹，跟他同一層的右側，剛好也有一個子樹，不管該子樹是一個樹的根節點、葉節點又或是沒有節點，都會從記憶體移除，因此兩個子樹的內容都會移除後才返回，因此目前處理 curr 的處理方式是正確的。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def binaryTreePaths(self, root: Optional[TreeNode]) -> List[str]:
        
        res = []

        def traverse(node, curr):
            if not node:
                return
            if not node.left and not node.right:
                curr.append(str(node.val))
                res.append("->".join(curr))
                curr.pop()
                return
            curr.append(str(node.val))
            traverse(node.left, curr)
            traverse(node.right, curr)
            curr.pop()
    
        traverse(root, [])
        
        return res
```