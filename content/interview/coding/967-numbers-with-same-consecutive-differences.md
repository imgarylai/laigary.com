---
slug: "967-numbers-with-same-consecutive-differences"
section: "coding"
title: "967. Numbers With Same Consecutive Differences"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1761888200
updated_at: 1761888225
published_at: 1761888200
---
[967\. Numbers With Same Consecutive Differences](https://leetcode.com/problems/numbers-with-same-consecutive-differences/)

```python
class Solution:
    def numsSameConsecDiff(self, n: int, k: int) -> List[int]:
        
        res = []
        
        def backtrack(curr, digit):
            if digit == n:
                res.append(curr)
                return res

            for i in range(10):
                if digit == 0 and i == 0: # leading zero
                    continue
                if digit > 0 and abs(i - curr % 10 ) != k: # Diff is not k
                    continue
                
                curr = curr * 10 + i
                digit += 1
                backtrack(curr, digit)
                curr = curr // 10
                digit -= 1
        
        backtrack(0, 0)

        return res
```