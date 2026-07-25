---
slug: "297-serialize-and-deserialize-binary-tree"
section: "coding"
title: "297. Serialize and Deserialize Binary Tree"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972935
updated_at: 1725927302
published_at: 1674972935
---
[297\. Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/)

這一題可以透過 [536\. Construct Binary Tree from String](/interview/coding/536-construct-binary-tree-from-string) 和 [606\. Construct String from Binary Tree](/interview/coding/606-construct-string-from-binary-tree) 的解答直接回答答，不過上述兩個問題的解法都不是很容易，在面試中要全部寫出來且沒有錯誤其實是有點難的，答案太長了礙於篇幅就暫時略過，直接複製貼上就可以了。

## 前序遍歷

```python
# Definition for a binary tree node.
# class TreeNode(object):
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Codec:

    def serialize(self, root):
        """Encodes a tree to a single string.

        :type root: TreeNode
        :rtype: str
        """
        res = []
        def traverse(root):
            if not root:
                res.append('#')
                return
            res.append(str(root.val))
            traverse(root.left)
            traverse(root.right)
        traverse(root)
        return ','.join(res)

    def deserialize(self, data):
        """Decodes your encoded data to tree.

        :type data: str
        :rtype: TreeNode
        """
        if not data: return None
        nodes = deque(data.split(','))
        def traverse(nodes):
            rootVal = nodes.popleft()
            if rootVal == '#': return None
            root = TreeNode(rootVal)
            root.left = traverse(nodes)
            root.right = traverse(nodes)
            return root
        return traverse(nodes)



# Your Codec object will be instantiated and called as such:
# ser = Codec()
# deser = Codec()
# ans = deser.deserialize(ser.serialize(root))

```

## 後序遍歷

```python
# Definition for a binary tree node.
# class TreeNode(object):
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Codec:

    def serialize(self, root):
        """Encodes a tree to a single string.

        :type root: TreeNode
        :rtype: str
        """
        res = []
        def traverse(root):
            if not root: 
                res.append('#')
                return
            traverse(root.left)
            traverse(root.right)
            res.append(str(root.val))
        traverse(root)
        return ','.join(res)



    def deserialize(self, data):
        """Decodes your encoded data to tree.

        :type data: str
        :rtype: TreeNode
        """
        if not data: return None
        nodes = data.split(',')
        def traverse(nodes):
            rootVal = nodes.pop()
            if rootVal == '#': return None
            root = TreeNode(rootVal)
            root.right = traverse(nodes)
            root.left = traverse(nodes)
            return root

        return traverse(nodes)



# Your Codec object will be instantiated and called as such:
# ser = Codec()
# deser = Codec()
# ans = deser.deserialize(ser.serialize(root))

```

## 廣度優先 BFS

```python
# Definition for a binary tree node.
# class TreeNode(object):
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None

class Codec:

    def serialize(self, root):
        """Encodes a tree to a single string.

        :type root: TreeNode
        :rtype: str
        """
        res = []
        q = deque([root])
        while q:
            size = len(q)
            for i in range(size):
                node = q.popleft()
                if node:
                    res.append(str(node.val))
                    q.append(node.left)
                    q.append(node.right)
                else:
                    res.append('#')
        return ','.join(res)

    def deserialize(self, data):
        """Decodes your encoded data to tree.

        :type data: str
        :rtype: TreeNode
        """
        if not data: return None
        nodes = deque(data.split(','))
        rootVal = nodes.popleft()
        if rootVal == '#': return None
        root = TreeNode(int(rootVal))
        q = deque([root])

        while q:
            size = len(q)
            for i in range(size):
                node = q.popleft()
                leftVal = nodes.popleft()
                rightVal = nodes.popleft()
                if leftVal != '#':
                    node.left = TreeNode(int(leftVal))
                    q.append(node.left)
                if rightVal != '#':
                    node.right = TreeNode(int(rightVal))
                    q.append(node.right)
        return root



# Your Codec object will be instantiated and called as such:
# ser = Codec()
# deser = Codec()
# ans = deser.deserialize(ser.serialize(root))

```