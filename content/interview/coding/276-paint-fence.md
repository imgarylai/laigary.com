---
slug: "276-paint-fence"
section: "coding"
title: "276. Paint Fence"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1707884648
updated_at: 1709421660
published_at: 1707884648
---
[276\. Paint Fence](https://leetcode.com/problems/paint-fence/)

```python
class Solution:
    def numWays(self, n: int, k: int) -> int:
        
        memo = {}
        def dfs(ways):
            if ways == 1:
                return k
            if ways == 2:
                return k * k
            
            if ways not in memo:
                memo[ways] = (k - 1) * (dfs(ways - 1) + dfs(ways - 2))
            
            return memo[ways]
        
        return dfs(n)
```