---
slug: "1456-maximum-number-of-vowels-in-a-substring-of-given-length"
section: "coding"
title: "1456. Maximum Number of Vowels in a Substring of Given Length"
status: "published"
pinned: false
tags: ["Sliding Window"]
created_at: 1709961501
updated_at: 1709961533
published_at: 1709961501
---
[1456\. Maximum Number of Vowels in a Substring of Given Length](https://leetcode.com/problems/maximum-number-of-vowels-in-a-substring-of-given-length/)

```python
class Solution:
    def maxVowels(self, s: str, k: int) -> int:
        
        vowels = {"a", "e", "i", "o", "u"}

        count = 0
        for i in range(k):
            if s[i] in vowels:
                count += 1

        maxLength = count

        for i in range(k, len(s)):
            if s[i] in vowels:
                count += 1
            if s[i - k] in vowels:
                count -= 1
            maxLength = max(maxLength, count)

        return maxLength
```