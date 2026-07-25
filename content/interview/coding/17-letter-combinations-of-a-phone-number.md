---
slug: "17-letter-combinations-of-a-phone-number"
section: "coding"
title: "17. Letter Combinations of a Phone Number"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674845088
updated_at: 1709446028
published_at: 1674845088
---
[17\. Letter Combinations of a Phone Number](https://leetcode.com/problems/letter-combinations-of-a-phone-number/)

這是一題看起來很嚇人的考題，不過最花時間的地方是寫出每個按鍵與其對應的字元。

窮舉的方式就是窮舉出每個按鈕有的字元，然後不斷的往下一個字元窮舉，窮舉到底後就是所有可行的排列組合。

```python
class Solution:
    def letterCombinations(self, digits: str) -> List[str]:
        if not digits:
            return []

        table = {
            '2': ['a', 'b', 'c'],
            '3': ['d', 'e', 'f'],
            '4': ['g', 'h', 'i'],
            '5': ['j', 'k', 'l'],
            '6': ['m', 'n', 'o'],
            '7': ['p', 'q', 'r', 's'],
            '8': ['t', 'u', 'v'],
            '9': ['w', 'x', 'y', 'z']
        }


        ans = []
        def backtrack(i, curr):
            if len(curr) == len(digits):
                ans.append(''.join(list(curr)))
                return
            else:
                for val in table[digits[i]]:
                    curr.append(val)
                    backtrack(i+1, curr)
                    curr.pop()
        backtrack(0, [])
        return ans
```