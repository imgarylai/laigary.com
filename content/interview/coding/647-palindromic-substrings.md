---
slug: "647-palindromic-substrings"
section: "coding"
title: "647. Palindromic Substrings"
status: "published"
pinned: false
tags: ["Classic", "Palindrome"]
created_at: 1674973111
updated_at: 1674973111
published_at: 1674973111
---
[647\. Palindromic Substrings](https://leetcode.com/problems/palindromic-substrings/)

有了 [5\. Longest Palindromic Substring](/interview/coding/5-longest-palindromic-substring) 的經驗，這一題就會好寫很多，不過這一題需要理解上一題的動態規劃法才會簡單，上一題的中心擴散法對於找最長的回文子字串非常有幫助，可是在這題卻不好用因為我們要找的是不重複的子字串 。暴力法當然可以解，可是時間複雜度不夠好。

## 動態規劃

有了動態規劃的概念後，這一個題目就變成我們要不斷的去找出哪兩個位置之間的子字串是回文。取得解答的方式就是每次執行完動態轉移方程式之後，如果位置 `i` 和 `j` 之間的字串是回文，就把字串 `i` 到 `j` 的子字串加入到答案裡面。最後我們就去統計有幾個。這個解法不只是解決了有幾個，更解決了有哪些子字串的組合，如果沒有要求的話，我們其實可以簡單一點，用一個計數器計算就好。

```python
class Solution:
    def countSubstrings(self, s: str) -> int:

        l = len(s)
        dp = [[False for _ in range(l)] for _ in range(l)]
        ans = 0
        # res = []

        for i in range(l):
            dp[i][i] = True
            ans += 1
            # res.append(s[i:i+1])

        for end in range(1, l):
            for begin in range(end):
                if s[begin] != s[end]:
                    dp[begin][end] = False
                else:
                    if end - 1 - (begin + 1) + 1 <= 1:
                        dp[begin][end] = True
                    else:
                        dp[begin][end] = dp[begin + 1][end - 1]

                if dp[begin][end]:
                    ans += 1
                    # res.append(s[begin:end+1])
        return ans
        # return len(res)

```