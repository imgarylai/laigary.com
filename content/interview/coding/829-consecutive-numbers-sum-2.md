---
slug: "829-consecutive-numbers-sum-2"
section: "coding"
title: "829. Consecutive Numbers Sum"
status: "published"
pinned: false
tags: []
created_at: 1745900744
updated_at: 1745902025
published_at: 1745900744
---
[829\. Consecutive Numbers Sum](https://leetcode.com/problems/consecutive-numbers-sum/)

這個題目我覺得不用太糾結於最佳解，這個偏向數學題目，但是我覺的是很好的面試題目

首先第一的絕對是不能先去想要怎麼拆解數字，我是先停下來觀察了一下什麼是連續正整數相加。像是：

-   連續兩個正整數相加：n + (n + 1) = 2 \* n + 1
-   連續三個正整數相加：n + (n + 1) + (n + 2) = 3 \* n + 3
-   連續四個正整數相加：n + (n + 1) + (n + 2) + (n + 3) = 4 \* n + 6
-   ...
-   連續 k 個整數相加 = k \* n + SUM(1:k-1)

```python
class Solution:
    def consecutiveNumbersSum(self, n: int) -> int:
        res = 1
        x = 2
        y = 1
        
        while x * 1 + y <= n:
            k = 1
            while x * k + y <= n:
                if x * k + y == n:
                    res += 1
                k += 1
            y += x
            x += 1
        return res
```