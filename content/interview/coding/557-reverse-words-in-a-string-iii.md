---
slug: "557-reverse-words-in-a-string-iii"
section: "coding"
title: "557. Reverse Words in a String III"
status: "published"
pinned: false
tags: ["Array", "Two Pointers"]
created_at: 1698801206
updated_at: 1761891108
published_at: 1698801206
---
[557. Reverse Words in a String III](https://leetcode.com/problems/reverse-words-in-a-string-iii/)

這一題如果掌握了 [151\. Reverse Words in a String](/interview/coding/151-reverse-words-in-a-string)的核心，只需要修改一小部分的邏輯就可以了。

```python
class Solution:
    def reverseWords(self, s: str) -> str:
        holder = []
        
        slow = 0
        fast = 0
        
        while fast < len(s):
            if s[fast] != " ":
                fast += 1
            else:
                if fast == slow:
                    fast += 1
                    slow += 1
                else:
                    holder.append(s[slow:fast][::-1])
                    fast += 1
                    slow = fast
                    
        if fast != slow:
            holder.append(s[slow:fast][::-1])
        return " ".join(holder)
```
```python
class Solution:
    def reverseWords(self, s: str) -> str:
        
        s = [c for c in s]
        def reverse(left, right):
            while left < right:
                s[left], s[right] = s[right], s[left]
                left += 1
                right -= 1
        

        slow = 0
        fast = 0

        while fast < len(s):
            if s[fast] == " ":
                reverse(slow, fast - 1)
                slow = fast
                slow += 1
            fast += 1

        reverse(slow, fast - 1)
        
        return ''.join(s)
```