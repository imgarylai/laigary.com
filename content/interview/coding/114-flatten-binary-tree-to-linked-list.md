---
slug: "114-flatten-binary-tree-to-linked-list"
section: "coding"
title: "114. Flatten Binary Tree to Linked List"
status: "published"
pinned: false
tags: ["Postorder Traversal", "Tree"]
created_at: 1674972897
updated_at: 1699250947
published_at: 1674972897
---
[114\. Flatten Binary Tree to Linked List](https://leetcode.com/problems/flatten-binary-tree-to-linked-list/)

這一是後續遍歷很經典的一道題目，體現了後續遍歷很重要的一個精神，當後續遍歷到一半，我們當下處在的位置，表示前面的遍歷都已經完成我們想要完成的事情了。

這一題如果用直覺來想，也會想到我們一定是要先把子樹給處理完，再慢慢往根節點走，然後我們也是先從左子樹處理，再往右子樹處理，當遞迴走下去的同時，我們回傳的樹最後的位置就可以了，因為我們當下的節點的左右節點，都是左子樹和右子樹的根節點。

這個題目當中，我們要把所有的扁平化都放到右子樹，有兩種情況要考慮，所以如果說當下的節點，只有右子樹，那我們就把右子樹的葉節點回傳回去就好，如果說左邊的節點有一個子樹，我們就要先把左邊子樹的「**最後一個節點**」，先指向右邊子樹的「**根節點**」，再來是我要把我指向右邊子樹的根節點改成指向左邊子樹的根節點，最後我要把指向左邊子樹的指向，改成指向空節點。這時候我們就完成了這一層的壓平。

最後，我們再判斷，左子樹或是右子樹存不存在，如果存在右邊，就返回右邊的葉節點，不存在才返回左側子樹的葉節點。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def flatten(self, root: Optional[TreeNode]) -> None:
        """
        Do not return anything, modify root in-place instead.
        """
        def traverse(root):
            if not root or not root.left and not root.right:
                return root
            left = traverse(root.left)
            right = traverse(root.right)
            if left:
                left.right = root.right
                root.right = root.left
                root.left = None
            return right if right else left
        traverse(root)

```