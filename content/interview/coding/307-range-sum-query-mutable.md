---
slug: "307-range-sum-query-mutable"
section: "coding"
title: "307. Range Sum Query - Mutable"
status: "published"
pinned: false
tags: ["Classic"]
created_at: 1674973112
updated_at: 1674973112
published_at: 1674973112
---
[307\. Range Sum Query - Mutable](https://leetcode.com/problems/range-sum-query-mutable/)

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

    def update(self, index: int, val: int) -> None:
        self.tree.update(index + 1, val - self.nums[index])
        self.nums[index] = val

    def sumRange(self, left: int, right: int) -> int:
        return self.tree.query(right + 1) - self.tree.query(left)


# Your NumArray object will be instantiated and called as such:
# obj = NumArray(nums)
# obj.update(index,val)
# param_2 = obj.sumRange(left,right)

```