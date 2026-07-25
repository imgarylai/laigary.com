---
slug: "536-construct-binary-tree-from-string"
section: "coding"
title: "536. Construct Binary Tree from String"
status: "published"
pinned: false
tags: ["Tree"]
created_at: 1674972895
updated_at: 1725927435
published_at: 1674972895
---
[536\. Construct Binary Tree from String](https://leetcode.com/problems/construct-binary-tree-from-string/)

做這題之前可以先完成 [606\. Construct String from Binary Tree](/interview/coding/606-construct-string-from-binary-tree) 。

這題的基礎題目是要將一棵樹字串化，用到的方法是後序遍歷，到了這個題目，目標在於要分析出一串字串的結構，進而不斷地頗析其子樹，而子樹的結構的樣式為：

```text
子樹 = 根節點（左子樹）（右子樹）

```

從題目的結構來看，我們會優先知道的節點資訊，反而是**根節點**，所以這個題目就變成了前序遍歷的題目了。

接下來都是看要怎麼將字串處理成我們需要的節點資訊

## 取得根節點的值

觀察題目，這個題目的根節點，不會有括號來影響，只是要注意的是負號，但是對 Python 來說，負號是可以透過 int 的 API 直接將字串轉換成數字的，所以我們用一個 Loop 來去找到這個數字的開頭與結尾，這樣我們就可以知道根節點的值是什麼了

```python
end = begin
if begin == len(s):
    return None
while end < len(s) and (s[end].isdigit() or s[end] == '-'):
    end += 1
root = TreeNode(int(s[begin:end]))

```

## 處理左右子樹

處理完根節點後，就可以先處理左子樹，再處理右子樹，如果我們已經處理完根節點了，剩下的事情就很好處理了因為

```text
（左子樹）（右子樹）可以看成這樣

左子樹 = 左子樹的根節點（左子樹的左子樹）（左子樹的右子樹）
右子樹 = 右子樹的根節點（右子樹的左子樹）（右子樹的右子樹）


（左子樹）（右子樹）==
    （左子樹的根節點（左子樹的左子樹）（左子樹的右子樹））（右子樹的根節點（右子樹的左子樹）（右子樹的右子樹））

```

所以我們就可以用遞迴的關係，只要將左、右子樹去掉最外面的括號，就可以用同樣的遞迴方程式去解析該子樹，所以剩下的部分就是細心的處理左右子樹的字串，這裡會用到另一個題目的知識點，就是如何頗析括號： [20\. Valid Parentheses](/interview/coding/20-valid-parentheses)。

在找到左、右子樹的開頭與結尾的括號的位置後，就可以將子樹的字串，遞迴的處理

```python
begin = end
if end < len(s) and s[end] == '(':
    stack = []
    stack.append(s[end])
    end += 1
    while end < len(s) and stack:
        if s[end] == '(':
            stack.append(s[end])
        if s[end] == ')':
            stack.pop()
        end += 1
    root.left = traverse(s[begin+1:end-1], 0)
begin = end
if end < len(s) and s[end] == '(':
    stack = []
    stack.append(s[end])
    end += 1
    while end < len(s) and stack:
        if s[end] == '(':
            stack.append(s[end])
        if s[end] == ')':
            stack.pop()
        end += 1
    root.right = traverse(s[begin+1:end-1], 0)

```

最後的結果

```python
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def str2tree(self, s: str) -> Optional[TreeNode]:       
        def traverse(s, begin):
            end = begin
            if begin == len(s):
                return None
            while end < len(s) and (s[end].isdigit() or s[end] == '-'):
                end += 1
            root = TreeNode(int(s[begin:end]))
            begin = end
            if end < len(s) and s[end] == '(':
                stack = []
                stack.append(s[end])
                end += 1
                while end < len(s) and stack:
                    if s[end] == '(':
                        stack.append(s[end])
                    if s[end] == ')':
                        stack.pop()
                    end += 1
                root.left = traverse(s[begin+1:end-1], 0)
            begin = end
            if end < len(s) and s[end] == '(':
                stack = []
                stack.append(s[end])
                end += 1
                while end < len(s) and stack:
                    if s[end] == '(':
                        stack.append(s[end])
                    if s[end] == ')':
                        stack.pop()
                    end += 1
                root.right = traverse(s[begin+1:end-1], 0)
            return root
        return traverse(s, 0)

```