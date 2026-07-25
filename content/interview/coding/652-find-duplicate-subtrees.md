---
slug: "652-find-duplicate-subtrees"
section: "coding"
title: "652. Find Duplicate Subtrees"
status: "published"
pinned: false
tags: ["Postorder Traversal", "Tree"]
created_at: 1674972897
updated_at: 1699250965
published_at: 1674972897
---
[652\. Find Duplicate Subtrees](https://leetcode.com/problems/find-duplicate-subtrees/)

建議先做過 [536\. Construct Binary Tree from String](/interview/coding/536-construct-binary-tree-from-string) 和 [606\. Construct String from Binary Tree](/interview/coding/606-construct-string-from-binary-tree) 。

這題一開始真的很不好想，因為如果單純從樹的角度來想，基本上要確定兩個樹是一樣的，就一定要遍歷整棵樹，這樣的話要暴力窮舉嗎？要暴力窮舉一棵樹，還是需要一個記憶的方式來看看是否有一樣的樹，**所以這個題目要想的是，如何記憶樹的結構**。

我們就從頭來想，有沒有什麼方法是可以記憶「已經出現過」的「樹」？兩個子樹要相同，一定是因為結構要相同，如果結構相同，那代表序列化後的字串也會相同，所以這個題目其實是序列化樹成字串的延伸題目。

因此我們就能夠利用將樹序列化的方式，來快速查找出哪些樹是有一樣的結構的，但是題目要求同樣結構的樹，我們只要給出任何一顆樹的根節點即可。所以我們最好還要記憶著另外一個東西，那就是**每個一樣結構的樹出現的頻率**。

因此當我們組合出該樹的序列化字串的時候：

1.  如果說還沒有出現過：目前還沒有沒有重複的子樹
2.  如果說已經出現 1 次：發現重複的子樹，記錄起來
3.  如果說已經出現超過 1 次：該同樣結構的子樹已經紀錄過了，不理他

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def findDuplicateSubtrees(self, root: Optional[TreeNode]) -> List[Optional[TreeNode]]:
        res = []
        table = defaultdict(int)

        def traverse(root):
            if not root:
                return ['#']
            left = traverse(root.left)
            right = traverse(root.right)
            subTree =  [str(root.val)] + left + right
            subTreeKey = ','.join(subTree)
            if table[subTreeKey] == 1:
                res.append(root)

            table[subTreeKey] += 1

            return subTree
        traverse(root)
        return res

```