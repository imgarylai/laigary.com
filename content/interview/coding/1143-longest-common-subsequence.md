---
slug: "1143-longest-common-subsequence"
section: "coding"
title: "1143. Longest Common Subsequence"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1674949019
updated_at: 1761777722
published_at: 1674949019
---
[1143\. Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/)

上課會學到的經典動態規劃問題，[最長公共子序列](https://en.wikipedia.org/wiki/Longest_common_subsequence_problem) 。

同時從兩個字字串的開頭出發

1.  如果說兩個字元一樣，那代表有一個公共子序列，繼續檢查兩個字串的下一個位子
2.  如果說兩個字元不一樣，那就分別先移動第一個字串指針，繼續第二個字串相比，或是移動第二個字串的指針，繼續第一個字串相比，再看哪一個子問題有最優解。

## 遞迴加記憶法

```python
class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:

        @cache
        def helper(i, j):
            if i == len(text1) or j == len(text2):
                return 0

            if text1[i] == text2[j]:
                return 1 + helper(i + 1, j + 1)

            else:
                return max(helper(i + 1, j), helper(i, j + 1))

        return helper(0, 0)
```

不用 `Python` 的 `lru_cache`

```python
class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        memo = {}
        def helper(i, j):
            if (i, j) not in memo:
                if i == len(text1) or j == len(text2):
                    memo[(i, j)] = 0
                elif text1[i] == text2[j]:
                    memo[(i, j)] = 1 + helper(i + 1, j + 1)
                else:
                    memo[(i, j)] = max(helper(i + 1, j), helper(i, j + 1))
            return memo[(i, j)]
```

## 動態規劃

### 自底向上

```python
class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        rows = len(text1) + 1
        cols = len(text2) + 1
        dp = [[0] * (cols) for _ in range(rows)]

        for row in range(1, rows):
            for col in range(1, cols):
                if text1[row-1] == text2[col-1]:
                    dp[row][col] = dp[row - 1][col - 1] + 1
                else:
                    dp[row][col] = max(dp[row-1][col], dp[row][col-1])

        return dp[-1][-1]
```

再更節省記憶體空間

```python
class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        rows = len(text1) + 1
        cols = len(text2) + 1
        previous = [0] * (cols)

        for row in range(1, rows):
            current = [0] * cols
            for col in range(1, cols):
                if text1[row-1] == text2[col-1]:
                    current[col] = 1 + previous[col - 1]
                else:
                    current[col] = max(current[col - 1], previous[col])
            previous = current
        return previous[-1]
```