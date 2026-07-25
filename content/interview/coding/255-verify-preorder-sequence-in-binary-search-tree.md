---
slug: "255-verify-preorder-sequence-in-binary-search-tree"
section: "coding"
title: "255. Verify Preorder Sequence in Binary Search Tree"
status: "published"
pinned: false
tags: ["Preorder Traversal", "Tree"]
created_at: 1674972897
updated_at: 1699250837
published_at: 1674972897
---
[255\. Verify Preorder Sequence in Binary Search Tree](https://leetcode.com/problems/verify-preorder-sequence-in-binary-search-tree/)

## 遞迴（超時）

想法是把第一個元素當作根節點，接著從第二個元素開始，把所有小於根節點的元素都放在 left ，接著把所有比根節點大的元素放在 right ，這裡有一個剪枝是如果說有元素比根節點小，那就不滿足 Binary Seacth Tree 的定義，直接回傳 False 。

接著將左邊與右邊繼續遞迴的判斷。

```python
class Solution:
    def verifyPreorder(self, preorder: List[int]) -> bool:
        if not preorder:
            return True
        root = preorder[0]
        left = []
        right = []

        i = 1
        while i < len(preorder):
            if preorder[i] < root:
                left.append(preorder[i])
            else:
                break
            i += 1

        while i < len(preorder):
            if preorder[i] > root:
                right.append(preorder[i])
            else:
                return False
            i += 1

        return self.verifyPreorder(left) and self.verifyPreorder(right)

```

這個解法可以進而簡化成，只要傳遞索引即可。

```python
class Solution:
    def verifyPreorder(self, preorder: List[int]) -> bool:        
        def helper(left, right):
            if left >= right:
                return True
            root = preorder[left]

            i = left + 1
            while i <= right and preorder[i] < root:
                i+=1

            j = i
            while j <= right:
                if preorder[j] <= root:
                    return False
                j += 1
            return helper(left+1, i-1) and helper(i, right)
        return helper(0, len(preorder) - 1)

```

這樣的時間複雜度是 $O(NlogN)$ ，最糟的情況很有可能所有的元素都是左子樹，甚至可以到 $O(N^2)$ 或是 $O(N!)$ 。

這題有不超時的辦法，不過我看了很多文章以及別人的講解，技巧性過強，我決定這個題目就到這裡為止。