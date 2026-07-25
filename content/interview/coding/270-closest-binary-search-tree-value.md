---
slug: "270-closest-binary-search-tree-value"
section: "coding"
title: "270. Closest Binary Search Tree Value"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1742881428
updated_at: 1761022990
published_at: 1742881428
---
[270\. Closest Binary Search Tree Value](https://leetcode.com/problems/closest-binary-search-tree-value/)

這個題目被標記為簡單是因為這個題目存在著一個簡單的解法，但是這個題目存在一個更優解，這個更優解就很難想得到。

簡單的解法是，既然這是一個 BST ，如果透過中序遍歷，就能依照順序列出所有的數字，這樣只要在重新掃描一次，就能得到題目所要求的最接近的值

```python
class Solution:
    def closestValue(self, root: Optional[TreeNode], target: float) -> int:
        if not root:
            return 0
        res = []
        def traverse(node):
            if not node:
                return
            traverse(node.left)
            res.append(node.val)
            traverse(node.right)
        
        traverse(root)

        if len(res) == 1:
            return root.val

        for i in range(1, len(res)):
            if res[i] > target:
                return res[i] if abs(res[i] - target) < abs(res[i-1] - target) else res[i - 1]
            elif res[i] == target:
                return res[i]
        # target 遠大於所有值
        return res[-1]
```

這樣的做法時間跟空間複雜度都為 $O(n)$ 。

```python
class Solution:
    def closestValue(self, root: Optional[TreeNode], target: float) -> int:
        def dfs(node, closest):
            if not node:
                return closest  # 遇到 None 時返回當前的最接近值
            
            # 如果 `node.val` 比 `closest` 更接近 target，更新 `closest`
            # 如果距離一樣，選擇較小的值
            if abs(node.val - target) < abs(closest - target) or \
               (abs(node.val - target) == abs(closest - target) and node.val < closest):
                closest = node.val
            
            # 根據 BST 特性，決定搜索方向
            if target < node.val:
                return dfs(node.left, closest)  # 往左子樹搜尋
            else:
                return dfs(node.right, closest)  # 往右子樹搜尋
        
        return dfs(root, root.val)  # 初始化 `closest` 為 root.val
```