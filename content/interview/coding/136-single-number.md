---
slug: "136-single-number"
section: "coding"
title: "136. Single Number"
status: "published"
pinned: false
tags: ["Bit Manipulation"]
created_at: 1674972900
updated_at: 1674972900
published_at: 1674972900
---
[136\. Single Number](https://leetcode.com/problems/single-number/)

這題的想法是用消去法，很像是抽鬼牌，每次只要有成對的牌就消去，直到最後一張就是鬼牌了（答案）

```python
class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        S = set()

        for num in nums:
            if num not in S:
                S.add(num)
            else:
                S.remove(num)

        return S.pop()

```

不過這題有一個很特別的解法，那就是靠位元操作去判斷。

```python
class Solution:
    def singleNumber(self, nums: List[int]) -> int:

        ans = 0
        for num in nums:
            ans ^= num

        return ans

```