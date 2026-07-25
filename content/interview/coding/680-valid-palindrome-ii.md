---
slug: "680-valid-palindrome-ii"
section: "coding"
title: "680. Valid Palindrome II"
status: "published"
pinned: false
tags: ["Classic", "Palindrome"]
created_at: 1674973112
updated_at: 1674973112
published_at: 1674973112
---
[680\. Valid Palindrome II](https://leetcode.com/problems/valid-palindrome-ii/)

這一題是 [125\. Valid Palindrome](/interview/coding/125-valid-palindrome) 的變形，考的是如果說最多可以修改一個字元，那是否可以形成回文？

在 LeetCode 很多的題目裡面，有時候修改和刪除其實是等價的（參考編輯距離的題目 [72\. Edit Distance](/interview/coding/72-edit-distance)）

例如：

`abca` 我們把 `b` 改成 `c` 或是 `c` 改成 `b` 又或是把 `b` 刪掉或把 `c` 刪掉，都可以成為回文。其實有點像是容錯的概念，又換句話說就是我們乾脆跳過這個檢查點好了。

這一題我們會使用遞迴來做，會使用遞迴來做的原因是因為我們就不用花大量的精力，去判斷我們是要給右指針跳過，或是左指針跳過，在這裏，我們也可以使用一個 bool 來判斷是不是已經修改過了。

```python
class Solution:
    def validPalindrome(self, s: str) -> bool:

        def isValidPalindrome(left, right, modified):
            while left <= right:
                if s[left] != s[right]:
                    if modified:
                        return False
                    else:
                        return isValidPalindrome(left + 1, right, True) or isValidPalindrome(left, right - 1, True)
                left += 1
                right -= 1
            return True

        return isValidPalindrome(0, len(s) - 1, False)

```

其實這個布林值也可用一個計數器來代替，去計算我們最多可以修改 k 個值。

```python
class Solution:
    def validPalindrome(self, s: str) -> bool:

        def isValidPalindrome(left, right, k):
            while left <= right:
                if s[left] != s[right]:
                    if k <= 0:
                        return False
                    else:
                        return isValidPalindrome(left + 1, right, k - 1) or isValidPalindrome(left, right - 1, k - 1)
                left += 1
                right -= 1
            return True

        return isValidPalindrome(0, len(s) - 1, 1)

```