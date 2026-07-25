---
slug: "2225-find-players-with-zero-or-one-losses"
section: "coding"
title: "2225. Find Players With Zero or One Losses"
status: "published"
pinned: false
tags: ["Hash Table"]
created_at: 1743742791
updated_at: 1743743232
published_at: 1743742791
---
[2225\. Find Players With Zero or One Losses](https://leetcode.com/problems/find-players-with-zero-or-one-losses/)

```python
class Solution:
    def findWinners(self, matches: List[List[int]]) -> List[List[int]]:
        
        records = defaultdict(lambda: defaultdict(int))
        for match in matches:
            winner, loser = match
            records[winner]['win'] += 1
            records[winner]['lost'] += 0
            records[loser]['win'] += 0
            records[loser]['lost'] += 1
        
        a = []
        b = []
        
        for player, record in records.items():
            if record['lost'] == 0:
                a.append(player)
            elif record['lost'] == 1:
                b.append(player)
        
        return [sorted(a), sorted(b)]
```