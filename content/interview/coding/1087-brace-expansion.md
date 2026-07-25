---
slug: "1087-brace-expansion"
section: "coding"
title: "1087. Brace Expansion"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674844990
updated_at: 1674845017
published_at: 1674844990
---
[1087\. Brace Expansion](https://leetcode.com/problems/brace-expansion/)

這個題目比較特別一點，一般來說 backtracking 的題目需要窮舉的項目都很明確，這題比較特別的是需要多花一點時間去解析這個字串，光解析字串或許就可以當作一題了。

我解析的方法很簡單，就是遇到括號後解析有哪些候選人，如果只是單純的字元，就直接放入陣列。

後面的方法就很簡單了。

```python
class Solution:
    def expand(self, s: str) -> List[str]:
        candidates = []
        i = 0
        while i < len(s):
            if s[i] == '{':
                j = i
                while j < len(s):
                    if s[j] == '}':
                        break
                    j += 1
                candidates.append(s[i+1:j].split(','))
                i = j
            else:
                candidates.append([s[i]])
            i += 1
        n = len(candidates)
        ans = []
        def backtrack(curr, index):
            if len(curr) == n:
                ans.append(''.join(list(curr)))
                return
            else:
                arr = candidates[index]
                for char in arr:
                    curr.append(char)
                    backtrack(curr, index + 1)
                    curr.pop()


        backtrack([], 0)
        ans.sort()
        return ans
```