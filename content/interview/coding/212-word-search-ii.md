---
slug: "212-word-search-ii"
section: "coding"
title: "212. Word Search II"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674845177
updated_at: 1674845218
published_at: 1674845177
---
[212\. Word Search II](https://leetcode.com/problems/word-search-ii/)

這一題是 [79\. Word Search](/interview/coding/79-word-search) 的進階版，原先我們要找的是給定一個字串，看這個一個字串是否存在，這題是給定很多字串，要看哪些字串存在？

第一個直覺的想法是，那就把第一題的解法把字串一個一個檢查就好，但是這樣的方法很明顯會超時。

```python
class Solution:
    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:
        rows = len(board)
        cols = len(board[0])
        directions = [(1,0),(-1,0),(0,1),(0,-1)]
        def backtrack(r, c, word):
            if len(word) == 0:
                return True
            if 0 <= r < rows and 0 <= c < cols and board[r][c] == word[0]:
                board[r][c] = '#'
                for dr, dc in directions:
                    if backtrack(r+dr, c+dc, word[1:]):
                        board[r][c] = word[0]
                        return True
                board[r][c] = word[0]
            return False
        ans = set()

        for word in set(words):
            for r in range(rows):
                for c in range(cols):
                    if backtrack(r, c, word):
                        ans.add(word)
        return ans
```