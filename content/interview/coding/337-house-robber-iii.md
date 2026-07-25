---
slug: "337-house-robber-iii"
section: "coding"
title: "337. House Robber III"
status: "published"
pinned: false
tags: ["Postorder Traversal", "Tree"]
created_at: 1674972895
updated_at: 1699251011
published_at: 1674972895
---
[337\. House Robber III](https://leetcode.com/problems/house-robber-iii/)

這一題是 [198\. House Robber](/interview/coding/198-house-robber) 和 [213\. House Robber II](/interview/coding/213-house-robber-ii) 的延伸題組，題目的情境相同，但是做法完全不同，是一題後序遍歷的問題。

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def rob(self, root: Optional[TreeNode]) -> int:

        def helper(node):
            if not node:
                return (0, 0)
            left = helper(node.left)
            right = helper(node.right)

            rob = node.val + left[1] + right[1]
            not_rob = max(left) + max(right)

            return rob, not_rob

        return max(helper(root))

```