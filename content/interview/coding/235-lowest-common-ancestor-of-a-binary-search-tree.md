---
slug: "235-lowest-common-ancestor-of-a-binary-search-tree"
section: "coding"
title: "235. Lowest Common Ancestor of a Binary Search Tree"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973111
updated_at: 1675139019
published_at: 1674973111
---
-   [235\. Lowest Common Ancestor of a Binary Search Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/)
-   [236\. Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/)
-   [1644\. Lowest Common Ancestor of a Binary Tree II](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree-ii/)
-   [1650\. Lowest Common Ancestor of a Binary Tree III](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree-iii/)
-   [1676\. Lowest Common Ancestor of a Binary Tree IV](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree-iv/)

235, 236 的做法完全一模一樣。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        if not root:
            return None
        if p == root or q == root:
            return root

        left = self.lowestCommonAncestor(root.left, p, q)
        right = self.lowestCommonAncestor(root.right, p, q)

        if left and right:
            return root
        if not left and not right:
            return None
        return left or right

```

1650 差在要先找出 Root 在哪

```python
class Solution:
    def lowestCommonAncestor(self, p: 'Node', q: 'Node') -> 'Node':
        t = p
        while t.parent:
            t = t.parent
        root = t
        nodes = set([p, q])
        def helper(root, nodes):
            if not root:
                return None
            if root in nodes:
                return root
            left = helper(root.left, nodes)
            right = helper(root.right, nodes)
            if left and right:
                return root
            return left or right
        return helper(root, nodes)

```

上面只是示範可以用前面的程式碼繼續來完成， 1650. 可以更簡單的在搜尋父節點時就找到最近共同祖先。

```python
class Solution:
    def lowestCommonAncestor(self, p: 'Node', q: 'Node') -> 'Node':
        # 由 p 開始向上搜尋 root 節點，並且把路徑上造訪過的節點都記錄起來
        # 因為最近共同祖先一定會在這個 set 裡面。
        # 如果在向上找的過程中，就遇到了 q 節點，那 q 就是最近共同祖先。
        t = p
        visited = {t}
        while t.parent:
            t = t.parent
            visited.add(t)
            if t == q:
                return q
        root = t
        k = q
        # 由 q 開始向上搜尋，如果找到有節點已經造訪過，那那個節點就是最近共同祖先
        while k.parent:
            k = k.parent
            if k in visited:
                return k
        # 這一行其實用不到，因為 root 其實一定會在造訪過的節點了。
        return root

```

這個系列只有第二道題目 1644 需要小心一點而已，因為題目給定的 p 、 q 可能不在樹裡面。但是做法完全可以一樣，只差在要多紀錄所有走訪過的點。

```python
class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        visited = set()
        nodes = set()
        nodes.add(p)
        nodes.add(q)
        def helper(root, nodes):
            visited.add(root)
            if not root:
                return None
            left = helper(root.left, nodes)
            right = helper(root.right, nodes)
            if root in nodes:
                return root
            if left and right:
                return root
            return left or right
        res = helper(root, nodes)
        if q not in visited or p not in visited:
            return None
        else:
            return res

```

## 後序遍歷

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        if not root:
            return None
        if p == root or q == root:
            return root

        left = self.lowestCommonAncestor(root.left, p, q)
        right = self.lowestCommonAncestor(root.right, p, q)

        if left and right:
            return root
        if not left and not right:
            return None
        return left or right

```