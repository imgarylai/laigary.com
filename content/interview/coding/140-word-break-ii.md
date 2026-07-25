---
slug: "140-word-break-ii"
section: "coding"
title: "140. Word Break II"
status: "published"
pinned: false
tags: ["Backtrack", "Classic", "Dynamic Programming"]
created_at: 1674973111
updated_at: 1767803641
published_at: 1674973111
---
[140\. Word Break II](https://leetcode.com/problems/word-break-ii/)

💡

請先參考 [139\. Word Break](/interview/coding/139-word-break)

在 [139\. Word Break](/interview/coding/139-word-break) 中，只要判斷是否可以找到組合就好，但是在這個進階題目中，不只是要找到是否有這個組合，還進一步問，如果存在著不同的排列組合，要進一步提供出所有的組合。

而要找排列組合的話，回溯法就會是最好的方法，可以直接修改前一題自頂向下的作法並改成回溯法的方式來做，因為是要找到所有的排列組合，所以會需要遍歷所有的情況，這時候就不需要使用記憶法來記錄子問題。

```python
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> List[str]:
        
        wordDict = set(wordDict)

        ans = []
        def dfs(i, candidate):
            if i == len(s):
                ans.append(" ".join(candidate))
                return True
            res = False
            for word in wordDict:
                if len(s[i:]) >= len(word):
                    if s[i:i + len(word)] == word:
                        candidate.append(word)
                        if dfs(i + len(word), candidate):
                            res = True
                        candidate.pop()
                        
            return res
        dfs(0, [])
        return ans
```

另外判斷是否有找到目標的條件判斷也並不需要了，因此可以簡化成以下方式。

```python
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> List[str]:
        
        wordDict = set(wordDict)

        ans = []
        def dfs(i, candidate):
            if i == len(s):
                ans.append(" ".join(candidate))
                return
            for word in wordDict:
                if len(s[i:]) >= len(word):
                    if s[i:i + len(word)] == word:
                        candidate.append(word)
                        dfs(i + len(word), candidate)
                        candidate.pop()

        dfs(0, [])
        return ans
```