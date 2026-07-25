---
slug: "429-n-ary-tree-level-order-traversal"
section: "coding"
title: "429. N-ary Tree Level Order Traversal"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972897
updated_at: 1709367915
published_at: 1674972897
---
[429\. N-ary Tree Level Order Traversal](https://leetcode.com/problems/n-ary-tree-level-order-traversal/)

可以先做這題 [116\. Populating Next Right Pointers in Each Node](/interview/coding/116-populating-next-right-pointers-in-each-node)

```python
"""
# Definition for a Node.
class Node:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children
"""

class Solution:
    def levelOrder(self, root: 'Node') -> List[List[int]]:
        if not root:
            return root
        queue = deque([root])
        ans = []
        level = 0
        while queue:
            size = len(queue)
            ans.append([])
            
            for i in range(size):
                node = queue.popleft()
                ans[level].append(node.val)
                for child in node.children:
                    queue.append(child)
            level += 1
        return ans
```
```python
"""
# Definition for a Node.
class Node:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children
"""

class Solution:
    def levelOrder(self, root: 'Node') -> List[List[int]]:
        if not root:
            return root
        queue = deque([root])
        ans = defaultdict(list)
        level = 0
        while queue:
            size = len(queue)
            for i in range(size):
                node = queue.popleft()
                ans[level].append(node.val)
                for child in node.children:
                    queue.append(child)
            level += 1
        return ans.values()

```