---
slug: "336-palindrome-pairs"
section: "coding"
title: "336. Palindrome Pairs"
status: "published"
pinned: false
tags: ["Palindrome"]
created_at: 1703834283
updated_at: 1743303859
published_at: 1703834283
---
[336\. Palindrome Pairs](https://leetcode.com/problems/palindrome-pairs/)

```python
class Solution:
    def palindromePairs(self, words: List[str]) -> List[List[int]]:
        
        def isPalindrome(word):
            left = 0
            right = len(word) - 1

            while left < right:
                if word[left] != word[right]:
                    return False
                left += 1
                right -= 1
            return True

        res = []
        i = 0
        
        while i < len(words):
            j = 0
            while j < len(words):
                if i != j:
                    word = words[i] + words[j]
                    if isPalindrome(word):
                        res.append([i, j])
                j += 1
            i += 1
        return res
```