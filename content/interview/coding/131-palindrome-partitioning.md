---
slug: "131-palindrome-partitioning"
section: "coding"
title: "131. Palindrome Partitioning"
status: "published"
pinned: false
tags: ["Backtrack", "Palindrome"]
created_at: 1764571684
updated_at: 1764572035
published_at: 1764571684
---
[131\. Palindrome Partitioning](https://leetcode.com/problems/palindrome-partitioning/)

```python
class Solution:
    def partition(self, s: str) -> List[List[str]]:
        res = []

        def isPalindrome(start, end):
            left = start
            right = end
            while left < right:
                if s[left] != s[right]:
                    return False
                left += 1
                right -= 1
            return True

        def backtrack(curr, start):
            if start == len(s):
                res.append(list(curr))
                return

            for i in range(start, len(s)):
                if isPalindrome(start, i):
                    curr.append(s[start:i+1])
                    backtrack(curr, i + 1)
                    curr.pop()
        
        backtrack([], 0)

        return res
```

類似題目

-   93 [93\. Restore IP Addresses](/interview/coding/93-restore-ip-addresses)