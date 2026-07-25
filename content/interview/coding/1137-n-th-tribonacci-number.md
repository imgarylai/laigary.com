---
slug: "1137-n-th-tribonacci-number"
section: "coding"
title: "1137. N-th Tribonacci Number"
status: "published"
pinned: false
tags: ["Dynamic Programming"]
created_at: 1704429907
updated_at: 1709445898
published_at: 1704429907
---
[1137\. N-th Tribonacci Number](https://leetcode.com/problems/n-th-tribonacci-number/)

## 自頂向下

```python
class Solution:
    def tribonacci(self, n: int) -> int:
        
        memo = defaultdict(int)
        memo[0] = 0
        memo[1] = 1
        memo[2] = 1
        def helper(n):
            if n in memo:
                return memo[n]
            
            memo[n] = helper(n - 1) + helper(n - 2) + helper(n - 3)
            return memo[n]
        return helper(n)
```

## 自底向上

```python
class Solution:
    def tribonacci(self, n: int) -> int:
        
        if n == 0:
            return 0
        elif n <= 2:
            return 1
        
        a = 0
        b = 1
        c = 1
        
        n -= 2
        
        while n > 0:
            a, b, c = b, c, a + b + c
            n -= 1
        
        return c
```