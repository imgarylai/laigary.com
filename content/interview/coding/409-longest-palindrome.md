---
slug: "409-longest-palindrome"
section: "coding"
title: "409. Longest Palindrome"
status: "published"
pinned: false
tags: ["Hash Table", "Palindrome"]
created_at: 1679266495
updated_at: 1722573864
published_at: 1679266495
---
[409\. Longest Palindrome](https://leetcode.com/problems/longest-palindrome/)

```python
from collections import Counter

class Solution:
    def longestPalindrome(self, s):
        """
        :type s: str
        :rtype: int
        """
        counter = Counter(s)
        
        r = 0
        for c in counter:
            r += counter[c] // 2 * 2
            if r % 2 == 0 and counter[c] % 2 == 1:
                r += 1
        return r
```