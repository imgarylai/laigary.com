---
slug: "316-remove-duplicate-letters"
section: "coding"
title: "316. Remove Duplicate Letters"
status: "published"
pinned: false
tags: ["Stack", "String"]
created_at: 1723937442
updated_at: 1723965280
published_at: 1723937442
---
[316\. Remove Duplicate Letters](https://leetcode.com/problems/remove-duplicate-letters/)

題目要求把一個字串中遇到重複的字元只保留其中一個字元後，將其他所有的重複的字元都移除，並且在最後結果的字串中，需要保留字典序。

這個題目的困難在於題目設立的幾個條件獨立的解決並不困難，困難的地方是要如何同時滿足，這時候可以練習一下不同的資料結構的型態。

第一個問題是如何移除所有的重複元素？

直覺的方式可以是利用 Hash Table 或是 Hash Set ，透過鍵值的方式可以建立找出獨立且唯一的值。Hash Table 還有一個優勢是增刪查找的時間複雜很低速度快。

但是如果要考慮第二個面向的時候，Hash Table 就會遇到了問題，因為題目在移除重複的字元時，需要考量原本的順序，另外也需要考量重複字元移除後是否有按照字典序排列。

```python
class Solution:
    def removeDuplicateLetters(self, s: str) -> str:
        res = []
        exist = [False] * 256
        count = [0] * 256
        for i in range(len(s)):
            count[ord(s[i])] += 1

        for c in s:
            count[ord(c)] -= 1
            if exist[ord(c)]:
                continue
            while res and ord(res[-1]) > ord(c):
                if count[ord(res[-1])] == 0:
                    break
                exist[ord(res.pop())] = False
            res.append(c)    
            exist[ord(c)] = True
        
        return "".join(res)
```