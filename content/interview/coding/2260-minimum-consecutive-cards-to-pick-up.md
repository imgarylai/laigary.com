---
slug: "2260-minimum-consecutive-cards-to-pick-up"
section: "coding"
title: "2260. Minimum Consecutive Cards to Pick Up"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1743823422
updated_at: 1743823440
published_at: 1743823422
---
[2260\. Minimum Consecutive Cards to Pick Up](https://leetcode.com/problems/minimum-consecutive-cards-to-pick-up/)

```python
class Solution:
    def minimumCardPickup(self, cards: List[int]) -> int:
        

        res = float('inf')
        table = {}
        for i in range(len(cards)):
            card = cards[i]
            if card in table:
                res = min(res, i - table[card] + 1)
            table[card] = i
        
        return -1 if res == float('inf') else res
```