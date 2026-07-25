---
slug: "303-range-sum-query-immutable"
section: "coding"
title: "303. Range Sum Query - Immutable"
status: "published"
pinned: false
tags: ["Classic", "Prefix Sum"]
created_at: 1674973113
updated_at: 1724001454
published_at: 1674973113
---
[303\. Range Sum Query - Immutable](https://leetcode.com/problems/range-sum-query-immutable/)

```python
class NumArray:

    def __init__(self, nums: List[int]):
        self.preSum = [0] * (len(nums) + 1)
        for i in range(1, len(self.preSum)):
            self.preSum[i] = self.preSum[i - 1] + nums[i - 1]

    def sumRange(self, left: int, right: int) -> int:
        return self.preSum[right + 1] - self.preSum[left]
```
```python
class BIT:
    def __init__(self, n: int):
        self.sums = [0] * (n + 1)

    def lowbit(self, i: int):
        return i & -i

    def update(self, i:int , delta: int):
        while i < len(self.sums):
            self.sums[i] += delta
            i += self.lowbit(i)

    def query(self, i: int) -> int:
        res = 0
        while i > 0:
            res += self.sums[i]
            i -= self.lowbit(i)
        return res

class NumArray:

    def __init__(self, nums: List[int]):
        self.nums = nums
        self.tree = BIT(len(nums))
        for i in range(len(self.nums)):
            self.tree.update(i + 1, nums[i])

    def sumRange(self, left: int, right: int) -> int:
        return self.tree.query(right + 1) - self.tree.query(left)


# Your NumArray object will be instantiated and called as such:
# obj = NumArray(nums)
# param_1 = obj.sumRange(left,right)

```