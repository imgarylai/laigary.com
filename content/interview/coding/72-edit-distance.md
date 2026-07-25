---
slug: "72-edit-distance"
section: "coding"
title: "72. Edit Distance"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674945040
updated_at: 1765339813
published_at: 1674945040
---
[72\. Edit Distance](https://leetcode.com/problems/edit-distance/)

這一題是真的很難的一道題目，難不是難在怎麼寫，是難在這個最短編輯距離的方式是：俄羅斯科學家弗拉基米爾·萊文斯坦在1965年提出的概念。又稱[萊文斯坦距離（Levenshtein distance）](https://zh.wikipedia.org/wiki/%E8%90%8A%E6%96%87%E6%96%AF%E5%9D%A6%E8%B7%9D%E9%9B%A2)。

理解原理後實作並不難，但是要直接看到題目想到要用動態規劃寫，超難！基本上如果有公司面試這個問題，我會直接放棄。

## 自頂向下

```python
class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        
        @cache
        def dp(i, j):
            if i == len(word1) and j == len(word2):
                return 0
            if i == len(word1):
                return len(word2) - j
            if j == len(word2):
                return len(word1) - i
            if word1[i] == word2[j]:
                return dp(i + 1, j + 1)
            return min(
                dp(i + 1, j),
                dp(i, j + 1),
                dp(i + 1, j + 1)
            ) + 1
        
        return dp(0, 0)
```

## 自底向上

```python
class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        rows = len(word1)
        cols = len(word2)
        if rows == 0 or cols == 0:
            return rows + cols

        memo = [[0] * (cols+1) for _ in range(rows+1)]

        for i in range(rows+1):
            memo[i][0] = i

        for j in range(cols+1):
            memo[0][j] = j

        for i in range(1, rows + 1):
            for j in range(1, cols + 1):
                if word1[i - 1] == word2[j - 1]:
                    memo[i][j] = memo[i-1][j-1]
                else:
                    left = memo[i - 1][j]
                    down = memo[i][j-1]
                    left_down = memo[i - 1][j - 1]
                    memo[i][j] = min(left, down, left_down) + 1
        return memo[rows][cols]
```