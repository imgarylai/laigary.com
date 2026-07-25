---
slug: "191-number-of-1-bits"
section: "coding"
title: "191. Number of 1 Bits"
status: "published"
pinned: false
tags: ["Bit Manipulation"]
created_at: 1674972901
updated_at: 1710096504
published_at: 1674972901
---
[191\. Number of 1 Bits](https://leetcode.com/problems/number-of-1-bits/)

每次檢查該整數的 bit 值的最右一位數是不是 `1` ，如果是的話計數器就可以加 `1` ，接著可以把整個 bit 向右移一個位置。

```python
class Solution:
    def hammingWeight(self, n: int) -> int:
        ans = 0

        while n:
            if (n & 1 == 1):
                ans += 1
            n = n >> 1

        return ans
```

上面比對 bit 的條件式其實只會判斷是否為 `1` 或是 `0` ，所以可以簡化成下述的表達式。

```python
class Solution:
    def hammingWeight(self, n: int) -> int:
        ans = 0

        while n:
            ans += n & 1
            n = n >> 1

        return ans

```

特殊技巧

```python
class Solution:
    def hammingWeight(self, n: int) -> int:
        ans = 0

        while n:
            n = n & (n - 1)
            ans += 1

        return ans

```