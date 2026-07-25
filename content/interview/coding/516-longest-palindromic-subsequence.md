---
slug: "516-longest-palindromic-subsequence"
section: "coding"
title: "516. Longest Palindromic Subsequence"
status: "published"
pinned: false
tags: ["Classic", "Palindrome"]
created_at: 1674973114
updated_at: 1674973114
published_at: 1674973114
---
[516\. Longest Palindromic Subsequence](https://leetcode.com/problems/longest-palindromic-subsequence/)

這一題和 [647\. Palindromic Substrings](/interview/coding/647-palindromic-substrings) 很像，只是其中的差異是一個問的是「子字串」，一個問的是「子序列」。

子序列的排列情況會比子字串多很多，可是其實比較好想，利用回文的特性，我們要檢查的狀態就只有兩種：

1.  頭尾一樣，接著繼續檢查中間的最長回文子序列。
2.  頭尾不同，分別看先移動頭部的指標，和先移動尾部的指標，看哪邊可以拿到比較長的回文子序列。

## 遞迴

這樣的情況就可以寫出遞迴的關係式，其中有兩種基本狀況要處理，繼續複習回文的特性，那就是要考慮字串的長度是奇數或是偶數。

1.  如果是奇數長度的回文，最終的情況會是**左右指針指向同一個位置**，這時候的回文長度是 `1` 。
2.  如果是偶數長度的回文，最終的情況會是**左右指針相鄰，位置差一，且兩個字是一模一樣的**，這時候的回文長度是 `2` 。

```python
class Solution:
    def longestPalindromeSubseq(self, s: str) -> int:

        def helper(i, j):
            # 長度為奇數的回文
            if i == j:
                return 1
            # 長度為偶數的回文
            elif j - i == 1 and s[i] == s[j]:
                return 2
            else:
                # 頭尾一樣，接著繼續檢查中間的最長回文子序列。
                if s[i] == s[j]:
                    return 2 + helper(i+1, j-1)
                # 頭尾不同，分別看先移動頭部的指標，和先移動尾部的指標，
                # 看哪邊可以拿到比較長的回文子序列。
                else:
                    return max(helper(i+1, j), helper(i, j-1))
        return helper(0, len(s)-1)

```

## 自頂向下

上面的題目，很明顯的存在重疊的子問題，因此可以透過記憶法來減少運算的次數。

### Python 內建的記憶法

```python
class Solution:
    def longestPalindromeSubseq(self, s: str) -> int:
        @lru_cache(None)
        def helper(i, j):
            if i == j:
                return 1
            elif j - i == 1 and s[i] == s[j]:
                return 2
            else:
                if s[i] == s[j]:
                    return 2 + helper(i+1, j-1)
                else:
                    return max(helper(i+1, j), helper(i, j-1))

```

### 自己實作記憶法

```python
class Solution:
    def longestPalindromeSubseq(self, s: str) -> int:        
        memo = {}
        def helper(i, j):
            # 如果 (i, j) 不存在於記憶體
            if (i, j) not in memo:
                if  i == j:
                    memo[(i, j)] = 1    
                elif j - i == 1 and s[i] == s[j]:
                    memo[(i, j)] = 2
                else:
                    if s[i] == s[j]:
                        memo[(i, j)] = 2 + helper(i+1, j-1)
                    else:
                        memo[(i, j)] = max(helper(i+1, j), helper(i, j-1))
            # 存在於記憶體，直接回傳
            return memo[(i, j)]   
        return helper(0, len(s)-1)

```

## 自底向上

```python
class Solution:
    def longestPalindromeSubseq(self, s: str) -> int:

        l = len(s)

        dp = [[0 for _ in range(l)] for _ in range(l)]

        for i in range(l):
            dp[i][i] = 1

        for start in reversed(range(l-1)):
            for end in range(start, l):
                if s[start] == s[end]:
                    dp[start][end] = 2 + dp[start+1][end-1]
                else:
                    dp[start][end] = max(dp[start+1][end], dp[start][end-1])

        return dp[0][l-1]

```