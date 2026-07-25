---
slug: "2000-reverse-prefix-of-word"
section: "coding"
title: "2000. Reverse Prefix of Word"
status: "published"
pinned: false
tags: ["Two Pointers"]
created_at: 1761949236
updated_at: 1761949259
published_at: 1761949236
---
[2000\. Reverse Prefix of Word](https://leetcode.com/problems/reverse-prefix-of-word/)

```python
class Solution:
    def reversePrefix(self, word: str, ch: str) -> str:
        
        def reverseWord(i, j):
            while i < j:
                word[i], word[j] = word[j], word[i]
                i += 1
                j -= 1

        word = [c for c in word]
        n = len(word)
        slow = 0
        fast = 0
        seen = False
        while fast < n:
            if word[fast] == ch and not seen:
                reverseWord(slow, fast)
                seen = True
            fast += 1
        
        return ''.join(word)
```