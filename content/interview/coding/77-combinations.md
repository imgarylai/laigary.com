---
slug: "77-combinations"
section: "coding"
title: "77. Combinations"
status: "published"
pinned: false
tags: ["Backtrack"]
created_at: 1674844199
updated_at: 1761710162
published_at: 1674844199
---
[77\. Combinations](https://leetcode.com/problems/combinations/)

這一個題目的精神和我們平常窮舉的精神一樣，我們先從最小的數字開始，慢慢地的和比自己大的樹去取組合，列完後，找到次小的數字，重複同樣的動作。

我們從 `1` 開始，一直到 `n + 1` ，看看有幾種組合，每往下探索的時候，我們要從下一個數字來開始看。

```python
class Solution:
    def combine(self, n: int, k: int) -> List[List[int]]:

        res = []
        
        def backtrack(start, curr):
            if len(curr) == k:
                res.append(curr.copy())
                return
            
            for i in range(start, n + 1):
                curr.append(i)
                backtrack(i + 1, curr)
                curr.pop()
            
        
        backtrack(1, [])

        return res

```