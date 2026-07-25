---
slug: "266-palindrome-permutation"
section: "coding"
title: "266. Palindrome Permutation"
status: "published"
pinned: false
tags: ["Classic", "Palindrome"]
created_at: 1674973111
updated_at: 1674973111
published_at: 1674973111
---
[266\. Palindrome Permutation](https://leetcode.com/problems/palindrome-permutation/)

這一題的題目看起來很恐怖啊，又是回文，又是排列組合的，不過這一個題目其實只考了回文的定義，一個回文是奇數長度還是偶數長度。

1.  如果是奇數長度，代表所有出現的字元頻率一定是偶數，除了一個字的出現頻率是一次。
2.  如果是偶數長度，代表所有出現的字元頻率一定是偶數。

總和以上兩點，如果我們計算一個字串所有字元的出現頻率，字元出現頻率不是偶數的頻率，最多只能出現一次。

```python
class Solution:
    def canPermutePalindrome(self, s: str) -> bool:
        counter = Counter(s)

        count = 0

        for key in counter:
            if counter[key] % 2 == 1:
                count += 1

        return count <= 1

```

也可以提早退出，時間複雜度相等。

```python
class Solution:
    def canPermutePalindrome(self, s: str) -> bool:
        counter = Counter(s)

        count = 0

        for key in counter:
            if counter[key] % 2 == 1:
                count += 1
            if count >= 2:
                return False

        return True

```